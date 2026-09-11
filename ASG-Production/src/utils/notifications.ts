import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, authFetch } from '../config/api';

/**
 * Tampilkan notifikasi sistem yang kompatibel 100% untuk:
 * - Desktop Browser (PC/Mac/Windows)
 * - Android Mobile Chrome (PWA) -> Wajib via ServiceWorkerRegistration.showNotification()
 */
export async function showSystemNotification(
  title: string,
  options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  } = {}
) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const iconUrl = options.icon || '/icon-192.png';
  const notifOptions: any = {
    body: options.body || '',
    icon: iconUrl,
    badge: options.badge || iconUrl,
    vibrate: [200, 100, 200],
    tag: options.tag || `asg-notif-${Date.now()}`,
    renotify: true,
    data: options.data || {}
  };

  // 1. Android Chrome & PWA: Wajib Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, notifOptions);
        return;
      }
    } catch (swErr) {
      console.warn('[PWA Notification] SW showNotification error:', swErr);
    }
  }

  // 2. Desktop Browser fallback
  try {
    new Notification(title, notifOptions);
  } catch (desktopErr) {
    console.warn('[PWA Notification] Desktop Notification error:', desktopErr);
  }
}

/**
 * Otomatis daftarkan Web Push Token ke backend saat izin notifikasi aktif
 */
export async function syncWebPushToken(userId?: number | string) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const userDataStr = await AsyncStorage.getItem('userData');
      if (userDataStr) {
        const u = JSON.parse(userDataStr);
        targetUserId = u.id;
      }
    }
    if (!targetUserId) return;

    const { getFirebaseMessaging, VAPID_KEY } = await import('../config/firebase-web');
    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    const { getToken } = await import('firebase/messaging');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('✅ FCM Web Push Token obtained:', currentToken.substring(0, 20) + '...');
      await AsyncStorage.setItem('webPushToken', currentToken);

      await authFetch(`${API_BASE_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, pushToken: currentToken })
      });
      console.log('✅ FCM Web Push Token registered to server for user', targetUserId);
    }
  } catch (err) {
    console.error('⚠️ Failed to sync web push token:', err);
  }
}
