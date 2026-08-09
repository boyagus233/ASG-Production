# ASG Production — Sanggar Seni Application 🎭

Aplikasi Manajemen Job & Chat Real-Time untuk Sanggar Seni ASG Production (Built with React Native Expo & Node.js Express PostgreSQL).

## Fitur Utama
- **Master Role & User Management (CRUD + RBAC)**
- **Audit Log & Security Persistence**
- **Chatting WhatsApp-Style**:
  - Pembuatan Grup Job (Tanggal + Lokasi)
  - Multi-Select Anggota (Role -> Dropdown Nama -> Chip List)
  - Rekaman Voice Note (Audio Player & Waveform)
  - Berbagi Lokasi GPS
  - Upload Foto & Dokumen
  - Info Grup Modal
- **Dashboard Job Admin & Riwayat Job Selesai**
- **Alur Undangan Job Member (Accept / Reject)**
- **Push Notification HP (Android & iOS PWA)**

## Struktur Repository
- `/ASG-Production` — Frontend Mobile App (React Native Expo)
- `/backend` — Backend Server (Node.js, Express, PostgreSQL, Socket.io)

## Cara Menjalankan
1. **Backend**:
   ```bash
   cd backend
   npm install
   node migrate.js
   node migrate_chat.js
   node migrate_jobs.js
   node server.js
   ```
2. **Frontend**:
   ```bash
   cd ASG-Production
   npm install
   npx expo start --lan
   ```
