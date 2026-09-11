require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');

// Socket.io instance
const io = new Server({ cors: { origin: '*' } });

// Helper to attach API routes to an express app
function setupApiApp(expressApp) {
  expressApp.use(cors());
  expressApp.use(express.json());
  
  expressApp.use((req, res, next) => {
    req.io = io;
    next();
  });
  
  expressApp.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`[REQ] ${req.method} ${req.url}`);
    }
    next();
  });
  
  expressApp.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  const { authenticateToken } = require('./middleware/auth');

  expressApp.use('/api/auth', authRoutes);
  expressApp.use('/api/master', authenticateToken, masterRoutes);
  expressApp.use('/api/groups', authenticateToken, groupRoutes);
  expressApp.use('/api/messages', authenticateToken, messageRoutes);
  expressApp.use('/api/notifications', authenticateToken, notificationRoutes);
}

// 1. API ONLY APP (PORT 3000)
const apiApp = express();
setupApiApp(apiApp);
apiApp.get('/', (req, res) => {
  res.json({ status: 'online', service: 'ASG Production Backend API', version: '2.0.0' });
});

// 2. PWA APP (PORT 3001)
const pwaApp = express();
setupApiApp(pwaApp);
const pwaDir = fs.existsSync(path.join(__dirname, '../ASG-Production/dist'))
  ? path.join(__dirname, '../ASG-Production/dist')
  : path.join(__dirname, 'public');

pwaApp.use(express.static(pwaDir));
pwaApp.use((req, res, next) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/socket.io') || req.url.startsWith('/uploads')) return next();
  res.sendFile(path.join(pwaDir, 'index.html'));
});

// Sockets logic
io.on('connection', (socket) => {
  console.log('⚡ Socket client connected:', socket.id);

  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });

  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left group_${groupId}`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user_${userId}`);
  });
  
  socket.on('join_god_mode', () => {
    socket.join('GOD_MODE');
  });

  // Typing indicator events
  socket.on('typing_start', ({ groupId, userId, userName }) => {
    socket.to(`group_${groupId}`).emit('user_typing', { groupId, userId, userName });
  });

  socket.on('typing_stop', ({ groupId, userId }) => {
    socket.to(`group_${groupId}`).emit('user_stop_typing', { groupId, userId });
  });

  socket.on('disconnect', () => {
    console.log('⚡ Socket client disconnected:', socket.id);
  });
});

// Main Server
const PORT_MAIN = process.env.PORT || 4000;
const serverMain = http.createServer(pwaApp);
io.attach(serverMain);
serverMain.listen(PORT_MAIN, '0.0.0.0', () => {
  console.log(`🌐 ASG Production Server running on 0.0.0.0:${PORT_MAIN}`);
});

// Start Port 3002 (God Mode)
const monitorApp = express();
monitorApp.use(express.json());
monitorApp.use(cors());

monitorApp.use((req, res, next) => {
  console.log(`[MONITOR] ${req.method} ${req.url}`);
  next();
});

monitorApp.use('/', express.static(path.join(__dirname, 'public/monitor')));

monitorApp.post('/api/login', (req, res) => {
  console.log('[MONITOR] Login Attempt:', req.body);
  const { username, password } = req.body;
  const adminHash = '$2b$10$d4vk8kTG.kThy8FGfcAIP.LU1fqmZibo9MHkAQ97AlqN9B5Gx/SH6'; // @Naruto233
  
  if ((username || '').toLowerCase() === 'yamada' && bcrypt.compareSync(password || '', adminHash)) {
    res.json({ token: 'god_mode_activated_2026' });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

monitorApp.listen(3002, '127.0.0.1', () => {
  console.log('👁️  Port 3002: God Mode Monitor running strictly on 127.0.0.1 (Local Only)');
});
