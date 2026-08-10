const express = require('express');
const router = express.Router();
const db = require('../db');

// Helper untuk Audit Log
const logAudit = async (action, userId, details) => {
  try {
    await db.query(
      'INSERT INTO audit_logs (action, user_id, details) VALUES ($1, $2, $3)',
      [action, userId, details]
    );
  } catch (err) {
    console.error('Audit Log Error:', err);
  }
};

// Helper untuk Membuat Notifikasi Internal + Real-time Push ke Socket User
const createNotification = async (req, userId, title, body) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, title, body) VALUES ($1, $2, $3)',
      [userId, title, body]
    );
    if (req.io) {
      req.io.to(`user_${userId}`).emit('new_job_invitation', { title, body });
      req.io.emit('update_notifications');
    }
  } catch (err) {
    console.error('Create Notification Error:', err);
  }
};

// 1. Buat Grup Baru + Buat Undangan Job (Status PENDING)
router.post('/', async (req, res) => {
  const { name, owner_id, member_ids } = req.body;
  if (!name || !owner_id) return res.status(400).json({ error: 'Nama grup dan owner_id wajib diisi!' });

  try {
    const insertGroup = 'INSERT INTO groups (name, owner_id) VALUES ($1, $2) RETURNING *';
    const groupResult = await db.query(insertGroup, [name, owner_id]);
    const newGroup = groupResult.rows[0];

    // Tambahkan owner sebagai member utama grup
    await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)', [newGroup.id, owner_id]);

    // Kirim undangan ke member_ids (Status PENDING)
    if (member_ids && Array.isArray(member_ids)) {
      for (const memberId of member_ids) {
        if (memberId !== owner_id) {
          await db.query(
            'INSERT INTO job_invitations (group_id, user_id, status) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [newGroup.id, memberId, 'PENDING']
          );

          // Kirim Notifikasi Real-Time ke HP Member
          await createNotification(
            req,
            memberId,
            'Job Baru Ditawarkan! 💼',
            `Anda mendapatkan tawaran Job: "${name}". Masuk untuk accept atau reject.`
          );
        }
      }
    }

    // Catat Audit Log
    await logAudit('CREATE_GROUP', owner_id, `Membuat grup baru: ${name} (ID: ${newGroup.id}) dengan ${member_ids ? member_ids.length : 0} undangan`);

    // BROADCAST REAL-TIME VIA SOCKET.IO
    if (req.io) {
      req.io.emit('update_groups');
      req.io.emit('update_invitations');
      req.io.emit('update_dashboard');
    }

    res.status(201).json({ message: 'Grup & Undangan Job berhasil dibuat!', group: newGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 2. Ambil Semua Grup Aktif dimana user tersebut tergabung
router.get('/', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId diperlukan!' });

  try {
    const query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      JOIN group_members gm ON g.id = gm.group_id
      WHERE gm.user_id = $1
      ORDER BY g.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 3. Hapus Grup (Hanya Owner) + Masukkan ke History Job Selesai (REAL-TIME)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const check = await db.query(`
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g WHERE g.id = $1
    `, [id]);
    
    if (check.rows.length === 0) return res.status(404).json({ error: 'Grup tidak ditemukan!' });
    
    const targetGroup = check.rows[0];
    if (targetGroup.owner_id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Hanya pembuat grup yang bisa menghapus!' });
    }

    // ARSIPKAN KE RIWAYAT JOB SELESAI (group_history)
    await db.query(`
      INSERT INTO group_history (original_group_id, name, owner_id, member_count, created_at, completed_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [targetGroup.id, targetGroup.name, targetGroup.owner_id, targetGroup.member_count, targetGroup.created_at]);

    // Hapus grup
    await db.query('DELETE FROM groups WHERE id = $1', [id]);

    await logAudit('DELETE_GROUP', userId, `Menghapus & Mengarsipkan job/grup: ${targetGroup.name} (ID: ${id})`);

    // BROADCAST REAL-TIME VIA SOCKET.IO TO ALL CLIENTS AND DASHBOARD
    if (req.io) {
      req.io.emit('update_groups');
      req.io.emit('update_dashboard');
      req.io.to(`group_${id}`).emit('group_deleted', { groupId: id });
    }

    res.json({ message: 'Grup berhasil diselesaikan dan diarsipkan ke Riwayat Job!' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 4. Ambil Anggota Grup Aktif
router.get('/:id/members', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT u.id, u.username, u.nama_lengkap, u.email, r.role_name
      FROM group_members gm
      JOIN users u ON gm.user_id = u.id
      LEFT JOIN roles r ON u.id_role = r.id
      WHERE gm.group_id = $1
      ORDER BY u.nama_lengkap ASC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 5. Ambil Daftar Undangan Job PENDING untuk Member
router.get('/invitations/pending', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId diperlukan!' });

  try {
    const query = `
      SELECT ji.id as invitation_id, ji.status, ji.created_at as invited_at,
             g.id as group_id, g.name as group_name, g.created_at as group_created_at,
             u.nama_lengkap as owner_name
      FROM job_invitations ji
      JOIN groups g ON ji.group_id = g.id
      LEFT JOIN users u ON g.owner_id = u.id
      WHERE ji.user_id = $1 AND ji.status = 'PENDING'
      ORDER BY ji.created_at DESC
    `;
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 6. Respon Member terhadap Undangan Job (ACCEPT / REJECT) - REAL-TIME
router.post('/invitations/:invitationId/respond', async (req, res) => {
  const { invitationId } = req.params;
  const { action, userId } = req.body;

  if (!action || !userId) return res.status(400).json({ error: 'action dan userId diperlukan!' });

  try {
    const invRes = await db.query(`
      SELECT ji.*, g.name as group_name, g.owner_id
      FROM job_invitations ji
      JOIN groups g ON ji.group_id = g.id
      WHERE ji.id = $1
    `, [invitationId]);

    if (invRes.rows.length === 0) return res.status(404).json({ error: 'Undangan tidak ditemukan!' });
    const invitation = invRes.rows[0];

    const userRes = await db.query('SELECT nama_lengkap, username FROM users WHERE id = $1', [userId]);
    const userName = userRes.rows[0]?.nama_lengkap || userRes.rows[0]?.username || 'Anggota';

    if (action === 'ACCEPT') {
      await db.query('UPDATE job_invitations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['ACCEPTED', invitationId]);
      await db.query('INSERT INTO group_members (group_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [invitation.group_id, userId]);

      const pendingCheck = await db.query(
        "SELECT COUNT(*) FROM job_invitations WHERE group_id = $1 AND status = 'PENDING'",
        [invitation.group_id]
      );
      
      if (parseInt(pendingCheck.rows[0].count) === 0) {
        await createNotification(
          req,
          invitation.owner_id,
          'Semua Member Sudah Masuk! 🎉',
          `Seluruh anggota yang diundang telah menyetujui job "${invitation.group_name}".`
        );
      }

      if (req.io) {
        req.io.emit('update_groups');
        req.io.emit('update_invitations');
        req.io.emit('update_dashboard');
      }

      res.json({ message: 'Anda berhasil menerima job ini!', status: 'ACCEPTED' });

    } else if (action === 'REJECT') {
      await db.query('UPDATE job_invitations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', ['REJECTED', invitationId]);

      await createNotification(
        req,
        invitation.owner_id,
        'Anggota Menolak Job! ⚠️',
        `"${userName}" tidak bisa mengikuti job "${invitation.group_name}".`
      );

      if (req.io) {
        req.io.emit('update_invitations');
        req.io.emit('update_dashboard');
      }

      res.json({ message: 'Anda telah menolak job ini.', status: 'REJECTED' });
    } else {
      res.status(400).json({ error: 'Action harus ACCEPT atau REJECT' });
    }

  } catch (error) {
    console.error('Error responding to invitation:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 7. Ambil Statistik Dashboard Admin & Riwayat Job Selesai
router.get('/dashboard-stats', async (req, res) => {
  try {
    const activeJobsQuery = 'SELECT COUNT(*) FROM groups';
    const completedJobsQuery = 'SELECT COUNT(*) FROM group_history';
    const totalMembersQuery = 'SELECT COUNT(*) FROM users';

    const historyQuery = `
      SELECT gh.*, u.nama_lengkap as owner_name
      FROM group_history gh
      LEFT JOIN users u ON gh.owner_id = u.id
      ORDER BY gh.completed_at DESC
    `;

    const [activeRes, completedRes, membersRes, historyRes] = await Promise.all([
      db.query(activeJobsQuery),
      db.query(completedJobsQuery),
      db.query(totalMembersQuery),
      db.query(historyQuery)
    ]);

    res.json({
      activeJobsCount: parseInt(activeRes.rows[0].count),
      completedJobsCount: parseInt(completedRes.rows[0].count),
      totalMembersCount: parseInt(membersRes.rows[0].count),
      history: historyRes.rows
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
