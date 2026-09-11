const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Wajib JWT Token untuk semua endpoint groups
router.use(authenticateToken);

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

    // PUSH NOTIFICATION (FCM)
    try {
      const { sendPushNotification } = require('../firebase');
      const tokenRes = await db.query('SELECT push_token FROM user_push_tokens WHERE user_id = $1', [userId]);
      const tokens = tokenRes.rows.map(r => r.push_token).filter(Boolean);
      if (tokens.length > 0) {
        await sendPushNotification(tokens, title, body, { type: 'job' });
      }
    } catch (pushErr) {
      console.error('Push Notification Error (Jobs):', pushErr);
    }
  } catch (err) {
    console.error('Create Notification Error:', err);
  }
};

// 1. Buat Grup Baru + Buat Undangan Job (Status PENDING)
router.post('/', async (req, res) => {
  const { name, owner_id, member_ids, event_date, call_time, show_time, venue_address, dresscode, rundown_notes } = req.body;
  if (!name || !owner_id) return res.status(400).json({ error: 'Nama grup dan owner_id wajib diisi!' });

  try {
    const insertGroup = 'INSERT INTO groups (name, owner_id, event_date, call_time, show_time, venue_address, dresscode, rundown_notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
    const groupResult = await db.query(insertGroup, [name, owner_id, event_date || null, call_time || null, show_time || null, venue_address || null, dresscode || null, rundown_notes || null]);
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

    // Ambil semua member (selain admin) untuk dikirimkan notifikasi
    const membersRes = await db.query('SELECT user_id FROM group_members WHERE group_id = $1 AND user_id != $2', [id, userId]);

    // Hapus grup
    await db.query('DELETE FROM groups WHERE id = $1', [id]);

    await logAudit('DELETE_GROUP', userId, `Menghapus & Mengarsipkan job/grup: ${targetGroup.name} (ID: ${id})`);

    // BROADCAST REAL-TIME VIA SOCKET.IO TO ALL CLIENTS AND DASHBOARD
    if (req.io) {
      req.io.emit('update_groups');
      req.io.emit('update_dashboard');
      req.io.to(`group_${id}`).emit('group_deleted', { groupId: id });
    }

    // Kirim Notifikasi ke Semua Member yang Terlibat
    for (const row of membersRes.rows) {
      await createNotification(
        req,
        row.user_id,
        'Job Telah Selesai! ✅',
        `Admin telah menyelesaikan dan menutup job "${targetGroup.name}". Terima kasih atas partisipasinya!`
      );
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
  const isAdmin = req.user && req.user.role === 1;
  try {
    const query = `
      SELECT u.id, u.username, u.nama_lengkap, u.avatar_url, u.no_hp, r.role_name
      ${isAdmin ? ', u.email' : ''}
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

      await createNotification(
        req,
        invitation.owner_id,
        'Anggota Menerima Job! ✅',
        `"${userName}" telah menyetujui tawaran job "${invitation.group_name}".`
      );

      await logAudit('ACCEPT_JOB', userId, `Menerima undangan job: ${invitation.group_name}`);

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

      await logAudit('REJECT_JOB', userId, `Menolak undangan job: ${invitation.group_name}`);

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

    const [activeRes, completedRes, membersRes] = await Promise.all([
      db.query(activeJobsQuery),
      db.query(completedJobsQuery),
      db.query(totalMembersQuery)
    ]);

    res.json({
      activeJobsCount: parseInt(activeRes.rows[0].count),
      completedJobsCount: parseInt(completedRes.rows[0].count),
      totalMembersCount: parseInt(membersRes.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// Endpoint untuk Riwayat Aktivitas (Paginated Audit Logs with Search & Filter)
router.get('/audit-logs', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = (req.query.search || '').trim();
  const actionFilter = (req.query.action || '').trim();
  const offset = (page - 1) * limit;

  try {
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (search) {
      whereConditions.push(`(a.details ILIKE $${paramIndex} OR u.nama_lengkap ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    if (actionFilter && actionFilter !== 'ALL') {
      whereConditions.push(`a.action = $${paramIndex}`);
      queryParams.push(actionFilter);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const dataQuery = `
      SELECT a.*, u.nama_lengkap, u.username
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
    `;

    const [result, countRes] = await Promise.all([
      db.query(dataQuery, [...queryParams, limit, offset]),
      db.query(countQuery, queryParams)
    ]);

    const totalCount = parseInt(countRes.rows[0].count);
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    res.json({
      data: result.rows,
      totalCount,
      totalPages,
      page,
      limit,
      hasMore: offset + limit < totalCount
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 8. Export Laporan Job (Excel)
const ExcelJS = require('exceljs');

router.get('/export-report', async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Job Selesai
    const sheet1 = workbook.addWorksheet('Riwayat Job Selesai');
    sheet1.columns = [
      { header: 'ID', key: 'id', width: 5 },
      { header: 'Nama Job', key: 'name', width: 30 },
      { header: 'Jumlah Member', key: 'member_count', width: 15 },
      { header: 'Tanggal Dibuat', key: 'created_at', width: 25 },
      { header: 'Tanggal Selesai', key: 'completed_at', width: 25 },
    ];
    
    const historyRes = await db.query('SELECT * FROM group_history ORDER BY completed_at DESC');
    historyRes.rows.forEach(row => {
      sheet1.addRow({
        id: row.id,
        name: row.name,
        member_count: row.member_count,
        created_at: new Date(row.created_at).toLocaleString(),
        completed_at: new Date(row.completed_at).toLocaleString()
      });
    });

    // Sheet 2: Audit Logs
    const sheet2 = workbook.addWorksheet('Aktivitas Member (Absensi)');
    sheet2.columns = [
      { header: 'Tipe', key: 'action', width: 15 },
      { header: 'Nama Member', key: 'nama_lengkap', width: 25 },
      { header: 'Detail', key: 'details', width: 50 },
      { header: 'Tanggal', key: 'created_at', width: 25 },
    ];

    const auditRes = await db.query(`
      SELECT a.action, a.details, a.created_at, u.nama_lengkap 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE a.action IN ('ACCEPT_JOB', 'REJECT_JOB')
      ORDER BY a.created_at DESC
    `);
    
    auditRes.rows.forEach(row => {
      sheet2.addRow({
        action: row.action,
        nama_lengkap: row.nama_lengkap || 'Unknown',
        details: row.details,
        created_at: new Date(row.created_at).toLocaleString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Job_ASG.xlsx');
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Gagal export laporan excel' });
  }
});

// 9. Ambil Detail Satu Grup
router.get('/:id/detail', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT g.*, 
        (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
      FROM groups g
      WHERE g.id = $1
    `;
    const result = await db.query(query, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Grup tidak ditemukan!' });
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching group detail:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 10. Update Briefing & Rundown Job (Admin / Owner)
router.put('/:id/briefing', async (req, res) => {
  const { id } = req.params;
  const { call_time, show_time, venue_address, dresscode, rundown_notes, event_date } = req.body;
  try {
    const result = await db.query(`
      UPDATE groups 
      SET call_time = $1, show_time = $2, venue_address = $3, dresscode = $4, rundown_notes = $5, event_date = COALESCE($6, event_date)
      WHERE id = $7 RETURNING *
    `, [call_time || null, show_time || null, venue_address || null, dresscode || null, rundown_notes || null, event_date || null, id]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'Grup tidak ditemukan!' });

    if (req.io) {
      req.io.to(`group_${id}`).emit('update_group_briefing', result.rows[0]);
      req.io.emit('update_groups');
    }

    res.json({ message: 'Briefing job berhasil diperbarui!', group: result.rows[0] });
  } catch (error) {
    console.error('Error updating briefing:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 11. Checklist Inventaris Alat & Kostum
router.get('/:id/checklist', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT c.*, u.nama_lengkap as checked_by_name
      FROM job_checklists c
      LEFT JOIN users u ON c.checked_by = u.id
      WHERE c.group_id = $1
      ORDER BY c.category ASC, c.id ASC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

router.post('/:id/checklist', async (req, res) => {
  const { id } = req.params;
  const { item_name, category } = req.body;
  if (!item_name) return res.status(400).json({ error: 'Nama perlengkapan wajib diisi!' });

  try {
    const result = await db.query(
      'INSERT INTO job_checklists (group_id, item_name, category) VALUES ($1, $2, $3) RETURNING *',
      [id, item_name.trim(), category || 'ALAT']
    );
    const item = result.rows[0];

    if (req.io) {
      req.io.to(`group_${id}`).emit('checklist_updated', { groupId: id });
    }

    res.status(201).json({ message: 'Item berhasil ditambahkan!', item });
  } catch (error) {
    console.error('Error adding checklist item:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

router.put('/:id/checklist/:itemId/toggle', async (req, res) => {
  const { id, itemId } = req.params;
  const { userId } = req.body;

  try {
    const check = await db.query('SELECT is_checked FROM job_checklists WHERE id = $1 AND group_id = $2', [itemId, id]);
    if (check.rows.length === 0) return res.status(404).json({ error: 'Item checklist tidak ditemukan!' });

    const newStatus = !check.rows[0].is_checked;
    const checkedBy = newStatus ? (userId || null) : null;

    const result = await db.query(`
      UPDATE job_checklists 
      SET is_checked = $1, checked_by = $2, updated_at = NOW() 
      WHERE id = $3 AND group_id = $4 
      RETURNING *
    `, [newStatus, checkedBy, itemId, id]);

    if (req.io) {
      req.io.to(`group_${id}`).emit('checklist_updated', { groupId: id });
    }

    res.json({ message: 'Status checklist berhasil diubah!', item: result.rows[0] });
  } catch (error) {
    console.error('Error toggling checklist item:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

router.delete('/:id/checklist/:itemId', async (req, res) => {
  const { id, itemId } = req.params;
  try {
    const result = await db.query('DELETE FROM job_checklists WHERE id = $1 AND group_id = $2 RETURNING id', [itemId, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Item tidak ditemukan!' });

    if (req.io) {
      req.io.to(`group_${id}`).emit('checklist_updated', { groupId: id });
    }

    res.json({ message: 'Item checklist berhasil dihapus!' });
  } catch (error) {
    console.error('Error deleting checklist item:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

// 12. Galeri Media & Dokumen Grup
router.get('/:id/media', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT m.id, m.content, m.attachment_url, m.created_at, m.sender_id, u.nama_lengkap as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.group_id = $1 AND m.attachment_url IS NOT NULL AND m.attachment_url != ''
      ORDER BY m.created_at DESC
    `;
    const result = await db.query(query, [id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching group media:', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
  }
});

module.exports = router;
