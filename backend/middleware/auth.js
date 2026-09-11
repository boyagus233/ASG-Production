const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_asg_production';

/**
 * Middleware untuk memverifikasi JWT Bearer Token secara KETAT
 * Mencegah data leak ke publik yang tidak terautentikasi.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ 
      error: 'Akses ditolak. Anda belum login atau token autentikasi tidak ditemukan!' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        error: 'Sesi login telah berakhir atau token tidak valid. Silakan login kembali.' 
      });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Middleware untuk memastikan user memiliki hak akses Administrator (Role 1)
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 1) {
    return res.status(403).json({ 
      error: 'Akses terlarang. Fitur ini hanya dapat diakses oleh Administrator!' 
    });
  }
  next();
}

module.exports = { authenticateToken, requireAdmin, JWT_SECRET };
