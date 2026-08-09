# 🎭 ASG Production — Sanggar Seni Application

[![React Native](https://img.shields.io/badge/React_Native-Expo_SDK_57-blue.svg)](https://expo.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-amber.svg)](LICENSE)

**ASG Production App** adalah platform manajemen pekerjaan (Job), koordinasi personil sanggar seni, dan obrolan grup real-time berstandar WhatsApp yang dirancang khusus untuk operasional **Sanggar Seni ASG Production**.

---

## 🌟 Fitur Utama Aplikasi

### 1. 💬 Chatting Real-Time Berstandar WhatsApp
- **Pembuat Nama Grup Dinamis**: Nama grup tersusun otomatis dari gabungan **Tanggal Acara + Lokasi Job** (Contoh: `12 Agustus 2026 LOK Tanggerang`).
- **Alur Pemilihan Anggota Terstruktur**: Owner/Admin memilih **Role** terlebih dahulu -> Memilih **Nama Lengkap** dari dropdown -> Menambahkan ke **Daftar Undangan** via tombol.
- **Voice Note Real (Rekaman Suara Asli)**: Perekaman suara mic HP sungguhan dengan widget pemutar audio (Tombol Play/Pause, Waveform gelombang suara, dan durasi).
- **Berbagi Lokasi GPS Real**: Mengambil koordinat GPS lokasi HP asli dan mengirimkan kartu lokasi dengan tautan langsung ke **Google Maps**.
- **Unggah Foto & Dokumen**: Pengiriman gambar galeri dan dokumen PDF/Office.
- **Info Grup Modal**: Menampilkan detail grup, total anggota, serta peran masing-masing personil di dalam grup obrolan.

### 2. 💼 Alur Undangan Job Member (Accept / Reject)
- Saat Admin membuat grup, status anggota yang diundang diset **`PENDING`**.
- Di HP Member muncul **Kartu Undangan Job**:
  - **`[ ✅ Terima Job ]`**: Member menerima tawaran job, resmi masuk ke grup chat dan bisa langsung berdiskusi.
  - **`[ ❌ Tolak ]`**: Member menolak job dan tidak dimasukkan ke dalam obrolan grup.

### 3. 📊 Dashboard Admin & Riwayat Job Selesai
- **Statistik Pekerjaan Real-time**: Kartu jumlah Job Aktif, Riwayat Job Selesai, dan Total Personil Terdaftar.
- **Arsip Abadi Riwayat Job (`group_history`)**: Ketika Admin membubarkan/menghapus grup chat, data pekerjaan **tidak hilang**, melainkan otomatis diarsipkan ke **Tabel Riwayat Job Selesai** (menampilkan Nama Job, Pembuat, Jumlah Personil, & Waktu Pembubaran).

### 4. 👤 Master Data & Hak Akses (RBAC)
- **Master Role & User**: Pengelolaan akun Admin, Owner, dan Member.
- **Kalender Interaktif (Date Picker)** untuk tanggal lahir dan tanggal acara job.
- **Audit Logs**: Catatan riwayat aktivitas penting (pembentukan dan pembubaran job oleh owner).
- **Auto-Login Guard**: Pengguna yang sudah login langsung diarahkan masuk ke Dashboard/Chats tanpa perlu login ulang.

---

## 🛠️ Teknologi Yang Digunakan

| Komponen | Teknologi |
|----------|-----------|
| **Frontend** | React Native, Expo Router (SDK 57), TypeScript, React Native Web |
| **Backend** | Node.js, Express.js, Socket.io, Multer (File Upload) |
| **Database** | PostgreSQL (Relational Database) |
| **Mobile & Web APIs** | `MediaRecorder` API (Voice Note), `navigator.geolocation` / `expo-location` (GPS) |

---

## 📁 Struktur Repositori

```text
ASG-Production/
├── ASG-Production/        # Application Frontend (React Native Expo)
│   ├── src/
│   │   ├── app/           # Expo Router File-based Routes (chats, dashboard, master, login, etc)
│   │   ├── components/    # Reusable UI Components (Toast, Dialog, dll)
│   │   └── config/        # API Configuration
│   └── app.json
│
├── backend/               # Backend Server (Node.js & Express)
│   ├── routes/            # REST API Endpoints (auth, groups, master, messages, notifications)
│   ├── uploads/           # Directory for uploaded voice notes, images, & documents
│   ├── db.js              # PostgreSQL Connection Pool
│   ├── migrate.js         # Base DB Migration
│   ├── migrate_chat.js    # Chat DB Migration
│   ├── migrate_jobs.js    # Job Invitations & History Migration
│   └── server.js          # Express & Socket.io Main Server
│
└── README.md
```

---

## 🚀 Panduan Memulai (Getting Started)

### 1. Prasyarat
- **Node.js**: v18.x atau lebih baru
- **PostgreSQL**: Terinstall dan berjalan di lokal/server.

### 2. Setup Backend Server
```bash
# Masuk ke direktori backend
cd backend

# Install dependensi
npm install

# Konfigurasi Database di db.js atau file .env
# Jalankan Script Migrasi Database
node migrate.js
node migrate_chat.js
node migrate_jobs.js

# Jalankan Server Backend (Port 3000)
node server.js
```

### 3. Setup Frontend Application
```bash
# Masuk ke direktori frontend
cd ASG-Production

# Install dependensi
npm install

# Jalankan Server Aplikasi Expo (LAN / Web)
npx expo start --lan
```

Aplikasi dapat dibuka via **Chrome Browser** di `http://localhost:8081` (Laptop) atau `http://<IP-LAPTOP>:8081` (HP Android)!

---

## 📝 Lisensi
Proyek ini dikembangkan khusus untuk **ASG Production - Sanggar Seni**. Hak Cipta Dilindungi Undang-Undang.
