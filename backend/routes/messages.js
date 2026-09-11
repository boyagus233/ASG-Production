const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');

// Wajib JWT Token untuk semua endpoint messages
router.use(authenticateToken);

// Setup Multer untuk Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const messageFileFilter = (req, file, cb) => {
  const forbiddenExts = ['.exe', '.bat', '.cmd', '.sh', '.php', '.phtml', '.js', '.py', '.pl', '.cgi', '.dll', '.jar', '.vbs', '.scr', '.msi'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (forbiddenExts.includes(ext)) {
    return cb(new Error('Format file terlarang demi keamanan sistem!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: messageFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB
});

// 1. Ambil semua pesan dalam satu grup (beserta Reaksi & Edit info)
router.get('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  try {
    const query = `
      SELECT m.*, u.username, u.nama_lengkap,
             (SELECT COUNT(*) FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id != m.sender_id) as read_count,
             COALESCE(
               (
                 SELECT json_agg(json_build_object('user_id', mr.user_id, 'emoji', mr.emoji, 'username', ru.username))
                 FROM message_reactions mr
                 JOIN users ru ON mr.user_id = ru.id
                 WHERE mr.message_id = m.id
               ), '[]'::json
             ) as reactions
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = $1
      ORDER BY m.created_at ASC
    `;
    const result = await db.query(query, [groupId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 2. Kirim pesan ke grup (Real-time Socket.io)
router.post('/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { sender_id, content, attachment_url, payload } = req.body;

  if (!sender_id || (!content && !attachment_url)) {
    return res.status(400).json({ error: 'Pesan tidak valid!' });
  }

  try {
    const insertQuery = `
      INSERT INTO messages (group_id, sender_id, content, attachment_url, payload)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const payloadJson = payload ? JSON.stringify(payload) : null;
    const result = await db.query(insertQuery, [groupId, sender_id, content || '', attachment_url || '', payloadJson]);
    const newMsg = result.rows[0];
    newMsg.reactions = [];

    // Ambil nama sender
    const userRes = await db.query('SELECT username, nama_lengkap FROM users WHERE id = $1', [sender_id]);
    if (userRes.rows.length > 0) {
      newMsg.username = userRes.rows[0].username;
      newMsg.nama_lengkap = userRes.rows[0].nama_lengkap;
    }

    // BROADCAST VIA SOCKET.IO TO GROUP
    if (req.io) {
      req.io.to(`group_${groupId}`).emit('receive_message', newMsg);
      req.io.emit('update_groups'); // refresh order di list chat
      
      // GOD MODE SNOOPING
      const groupNameRes = await db.query('SELECT name FROM groups WHERE id = $1', [groupId]);
      const godModePayload = {
        groupId,
        groupName: groupNameRes.rows[0]?.name || 'Grup',
        message: newMsg
      };

      if (global.chatLogsHistory) {
        global.chatLogsHistory.push(godModePayload);
        if (global.chatLogsHistory.length > 50) global.chatLogsHistory.shift();
      }

      req.io.to('god_mode').emit('god_mode_chat', godModePayload);

      // Real-time personal notification to each group member
      try {
        const groupRes = await db.query('SELECT name FROM groups WHERE id = $1', [groupId]);
        const groupName = groupRes.rows[0]?.name || 'Grup';
        const senderName = newMsg.nama_lengkap || newMsg.username || 'Seseorang';
        const membersRes = await db.query('SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2', [groupId, sender_id]);
        for (const m of membersRes.rows) {
          req.io.to(`user_${m.user_id}`).emit('new_chat_notification', {
            groupId,
            groupName,
            senderName,
            content: content || 'Mengirim pesan',
            message: newMsg
          });
        }
      } catch (err) {
        console.error('Error emitting personal chat notifications:', err);
      }
    }

    // PUSH NOTIFICATIONS
    try {
      const { sendPushNotification } = require('../firebase');
      const tokenQuery = `
        SELECT t.push_token 
        FROM user_push_tokens t
        JOIN group_members gm ON t.user_id = gm.user_id
        WHERE gm.group_id = $1 AND gm.user_id != $2
      `;
      const tokenRes = await db.query(tokenQuery, [groupId, sender_id]);
      const tokens = tokenRes.rows.map(r => r.push_token).filter(Boolean);
      
      if (tokens.length > 0) {
        const groupRes = await db.query('SELECT name FROM groups WHERE id = $1', [groupId]);
        const groupName = groupRes.rows[0]?.name || 'Grup';
        const senderName = newMsg.nama_lengkap || newMsg.username || 'Seseorang';
        
        await sendPushNotification(
          tokens,
          `${groupName}`,
          `${senderName}: ${content || 'Mengirim pesan'}`,
          { type: 'chat', groupId: groupId.toString() }
        );
      }
    } catch (pushErr) {
      console.error('Error sending push:', pushErr);
    }

    res.status(201).json({ message: 'Pesan terkirim!', data: newMsg });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 3. Upload File / Foto / Audio Voice Note
router.post('/:groupId/upload', upload.single('file'), async (req, res) => {
  const { groupId } = req.params;
  const { sender_id, payload } = req.body;

  if (!req.file || !sender_id) {
    return res.status(400).json({ error: 'File dan sender_id wajib diisi!' });
  }

  const attachment_url = `/uploads/${req.file.filename}`;

  try {
    const insertQuery = `
      INSERT INTO messages (group_id, sender_id, content, attachment_url, payload)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const payloadJson = payload ? JSON.stringify(payload) : null;
    const result = await db.query(insertQuery, [groupId, sender_id, '', attachment_url, payloadJson]);
    const newMsg = result.rows[0];
    newMsg.reactions = [];

    const userRes = await db.query('SELECT username, nama_lengkap FROM users WHERE id = $1', [sender_id]);
    if (userRes.rows.length > 0) {
      newMsg.username = userRes.rows[0].username;
      newMsg.nama_lengkap = userRes.rows[0].nama_lengkap;
    }

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('receive_message', newMsg);
      req.io.emit('update_groups');

      try {
        const groupRes = await db.query('SELECT name FROM groups WHERE id = $1', [groupId]);
        const groupName = groupRes.rows[0]?.name || 'Grup';
        const senderName = newMsg.nama_lengkap || newMsg.username || 'Seseorang';
        let fileType = 'Mengirim file';
        if (attachment_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) fileType = 'Mengirim foto';
        if (attachment_url.match(/\.(m4a|mp3|wav|ogg|aac|webm)$/i)) fileType = 'Mengirim pesan suara';
        const membersRes = await db.query('SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2', [groupId, sender_id]);
        for (const m of membersRes.rows) {
          req.io.to(`user_${m.user_id}`).emit('new_chat_notification', {
            groupId,
            groupName,
            senderName,
            content: fileType,
            message: newMsg
          });
        }
      } catch (err) {
        console.error('Error emitting personal chat notifications (upload):', err);
      }
    }

    // PUSH NOTIFICATIONS
    try {
      const { sendPushNotification } = require('../firebase');
      const tokenQuery = `
        SELECT t.push_token 
        FROM user_push_tokens t
        JOIN group_members gm ON t.user_id = gm.user_id
        WHERE gm.group_id = $1 AND gm.user_id != $2
      `;
      const tokenRes = await db.query(tokenQuery, [groupId, sender_id]);
      const tokens = tokenRes.rows.map(r => r.push_token).filter(Boolean);
      
      if (tokens.length > 0) {
        const groupRes = await db.query('SELECT name FROM groups WHERE id = $1', [groupId]);
        const groupName = groupRes.rows[0]?.name || 'Grup';
        const senderName = newMsg.nama_lengkap || newMsg.username || 'Seseorang';
        let fileType = 'Mengirim file';
        if (attachment_url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) fileType = 'Mengirim foto';
        if (attachment_url.match(/\.(m4a|mp3|wav|ogg|aac|webm)$/i)) fileType = 'Mengirim pesan suara';
        
        await sendPushNotification(
          tokens,
          `${groupName}`,
          `${senderName}: ${fileType}`,
          { type: 'chat', groupId: groupId.toString() }
        );
      }
    } catch (pushErr) {
      console.error('Error sending push:', pushErr);
    }

    res.status(201).json({ message: 'File berhasil diunggah!', data: newMsg });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 4. Mark Messages as Read
router.post('/:groupId/read', async (req, res) => {
  const { groupId } = req.params;
  const { user_id } = req.body;
  
  if (!user_id) return res.status(400).json({ error: 'user_id diperlukan' });

  try {
    const query = `
      INSERT INTO message_reads (message_id, user_id)
      SELECT id, $2 FROM messages WHERE group_id = $1
      ON CONFLICT (message_id, user_id) DO NOTHING
    `;
    await db.query(query, [groupId, user_id]);

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('messages_read', { groupId, user_id });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Add / Toggle Emoji Reaction
router.post('/:id/react', async (req, res) => {
  const { id } = req.params;
  const { user_id, emoji } = req.body;

  if (!user_id || !emoji) return res.status(400).json({ error: 'user_id dan emoji diperlukan' });

  try {
    // Check if reaction exists
    const check = await db.query('SELECT * FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3', [id, user_id, emoji]);
    let action = 'added';
    if (check.rows.length > 0) {
      await db.query('DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3', [id, user_id, emoji]);
      action = 'removed';
    } else {
      await db.query('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)', [id, user_id, emoji]);
    }

    // Get updated reactions for this message
    const reacRes = await db.query(`
      SELECT mr.user_id, mr.emoji, u.username
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.id
      WHERE mr.message_id = $1
    `, [id]);

    // Get group_id
    const msgRes = await db.query('SELECT group_id FROM messages WHERE id = $1', [id]);
    const groupId = msgRes.rows[0]?.group_id;

    if (req.io && groupId) {
      req.io.to(`group_${groupId}`).emit('message_reacted', { messageId: Number(id), reactions: reacRes.rows });
    }

    res.json({ message: `Reaction ${action}`, reactions: reacRes.rows });
  } catch (error) {
    console.error('Error handling reaction:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Edit Sent Text Message
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, content } = req.body;

  if (!user_id || !content) return res.status(400).json({ error: 'user_id dan content diperlukan' });

  try {
    const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Pesan tidak ditemukan' });
    
    const msg = msgRes.rows[0];
    if (msg.sender_id.toString() !== user_id.toString()) {
      return res.status(403).json({ error: 'Hanya pengirim yang bisa mengedit pesan ini' });
    }

    const updateRes = await db.query(
      'UPDATE messages SET content = $1, is_edited = TRUE, edited_at = NOW() WHERE id = $2 RETURNING *',
      [content, id]
    );

    const updatedMsg = updateRes.rows[0];

    if (req.io) {
      req.io.to(`group_${msg.group_id}`).emit('message_edited', { messageId: Number(id), content, is_edited: true });
    }

    res.json({ message: 'Pesan berhasil di-edit', data: updatedMsg });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Delete Message for Everyone
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (!user_id) return res.status(400).json({ error: 'user_id diperlukan' });

  try {
    const msgRes = await db.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (msgRes.rows.length === 0) return res.status(404).json({ error: 'Pesan tidak ditemukan' });

    const msg = msgRes.rows[0];
    if (msg.sender_id.toString() !== user_id.toString()) {
      return res.status(403).json({ error: 'Hanya pengirim yang bisa menghapus pesan ini' });
    }

    await db.query('DELETE FROM messages WHERE id = $1', [id]);

    if (req.io) {
      req.io.to(`group_${msg.group_id}`).emit('message_deleted', { messageId: Number(id) });
    }

    res.json({ message: 'Pesan berhasil dihapus untuk semua orang' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 8. Pin / Unpin Message for Group
router.post('/groups/:groupId/pin', async (req, res) => {
  const { groupId } = req.params;
  const { user_id, message_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'user_id diperlukan' });

  try {
    if (!message_id) {
      // Unpin
      await db.query('DELETE FROM pinned_messages WHERE group_id = $1', [groupId]);
      if (req.io) {
        req.io.to(`group_${groupId}`).emit('message_pinned', { groupId: Number(groupId), pinnedMessage: null });
      }
      return res.json({ message: 'Pesan dilepas dari pin', pinnedMessage: null });
    }

    await db.query(`
      INSERT INTO pinned_messages (group_id, message_id, pinned_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (group_id) DO UPDATE SET message_id = $2, pinned_by = $3, pinned_at = NOW()
    `, [groupId, message_id, user_id]);

    const pinnedRes = await db.query(`
      SELECT m.*, u.nama_lengkap as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1
    `, [message_id]);

    const pinnedMessage = pinnedRes.rows[0] || null;

    if (req.io) {
      req.io.to(`group_${groupId}`).emit('message_pinned', { groupId: Number(groupId), pinnedMessage });
    }

    res.json({ message: 'Pesan berhasil disematkan', pinnedMessage });
  } catch (error) {
    console.error('Error pinning message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 9. Get Pinned Message for Group
router.get('/groups/:groupId/pinned', async (req, res) => {
  const { groupId } = req.params;

  try {
    const pinnedRes = await db.query(`
      SELECT m.*, u.nama_lengkap as sender_name
      FROM pinned_messages pm
      JOIN messages m ON pm.message_id = m.id
      JOIN users u ON m.sender_id = u.id
      WHERE pm.group_id = $1
    `, [groupId]);

    res.json(pinnedRes.rows[0] || null);
  } catch (error) {
    console.error('Error fetching pinned message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
