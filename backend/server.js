const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const groupRoutes = require('./routes/groups');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  }
});

const path = require('path');

// Socket.io Middleware untuk Inject `io` ke REST API Routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('⚡ Socket client connected:', socket.id);

  // Masuk ke room grup chat tertentu
  socket.on('join_group', (groupId) => {
    socket.join(`group_${groupId}`);
    console.log(`Socket ${socket.id} joined group_${groupId}`);
  });

  // Keluar dari room grup chat
  socket.on('leave_group', (groupId) => {
    socket.leave(`group_${groupId}`);
    console.log(`Socket ${socket.id} left group_${groupId}`);
  });

  // User join room personal
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined user_${userId}`);
  });

  socket.on('disconnect', () => {
    console.log('⚡ Socket client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
