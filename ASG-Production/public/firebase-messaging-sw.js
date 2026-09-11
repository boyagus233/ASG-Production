// Scripts needed for Firebase Messaging in Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
const firebaseConfig = {
  apiKey: "AIzaSyAojiobndoMzC66bwRdBOJboQ3qLcfexek",
  authDomain: "asg-production-ee8d3.firebaseapp.com",
  projectId: "asg-production-ee8d3",
  storageBucket: "asg-production-ee8d3.firebasestorage.app",
  messagingSenderId: "459231455784",
  appId: "1:459231455784:web:3a7d6683ab7de0f59d231d"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Customize background notification handling here
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.data?.title || 'Notifikasi Baru ASG';
  const notificationOptions = {
    body: payload.data?.body || 'Anda menerima pesan baru',
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    tag: payload.data?.tag || 'asg-notification',
    renotify: true,
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
