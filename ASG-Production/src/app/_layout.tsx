import { Stack, router, usePathname } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Platform, View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL, getApiBaseUrl, authFetch } from '../config/api';

export default function RootLayout() {
  const pathname = usePathname();
  const [isOffline, setIsOffline] = useState(false);

  // Listener Offline
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Inisialisasi awal
      setIsOffline(!navigator.onLine);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let backListener: any;
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        const setup = async () => {
          backListener = await App.addListener('backButton', () => {
            const currentPath = pathnameRef.current || (typeof window !== 'undefined' ? window.location.pathname : '');
            const isTabOrRoot = currentPath === '/' || 
                                currentPath === '/login' || 
                                currentPath === '/register' || 
                                currentPath === '/chats' || 
                                currentPath === '/dashboard' || 
                                currentPath === '/calendar' || 
                                currentPath === '/settings' || 
                                currentPath === '/master' ||
                                currentPath === '/(tabs)/dashboard' || 
                                currentPath === '/(tabs)/chats' || 
                                currentPath === '/(tabs)/calendar' || 
                                currentPath === '/(tabs)/settings' || 
                                currentPath === '/(tabs)/master';

            if (isTabOrRoot) {
              App.exitApp();
            } else {
              if (typeof window !== 'undefined' && window.history && window.history.length > 1) {
                window.history.back();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/chats');
              }
            }
          });
        };
        setup();
      }
    });
    return () => {
      if (backListener) backListener.remove();
    };
  }, []);

  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      if (Capacitor.isNativePlatform()) {
        // Firebase Push Notifications khusus APK
        PushNotifications.createChannel({
          id: 'asg_high_importance',
          name: 'Notifikasi Utama ASG',
          description: 'Notifikasi penting ASG Production',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true
        }).catch(e => console.error('Error creating notification channel:', e));

        // Attach listeners FIRST before registering
        PushNotifications.addListener('registration', (token) => {
          console.log('Native Push Token registered:', token.value);
          AsyncStorage.setItem('nativePushToken', token.value);
          
          // Auto-register to backend if user logged in
          AsyncStorage.getItem('userData').then(userDataStr => {
            if (userDataStr) {
              try {
                const user = JSON.parse(userDataStr);
                const targetUrl = getApiBaseUrl();
                authFetch(`${targetUrl}/api/notifications/register-token`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: user.id, pushToken: token.value })
                }).catch(err => console.error('Error auto-sending token:', err));
              } catch (e) {}
            }
          });
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Registration Error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Foreground Push Notification Received:', notification);
          const title = notification.title || notification.data?.title || 'Notifikasi Baru 🔔';
          const body = notification.body || notification.data?.body || '';
          if (typeof window !== 'undefined') {
            alert(`🔔 ${title}\n${body}`);
          }
        });

        // Request permissions and register AFTER listeners are active
        PushNotifications.requestPermissions().then(result => {
          if (result.receive === 'granted') {
            PushNotifications.register();
          }
        });
      }
    });
  }, []);

  // Web Push Notifications via Firebase
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      import('../config/firebase-web').then(({ getFirebaseMessaging, VAPID_KEY }) => {
        getFirebaseMessaging().then(async (messaging) => {
          if (!messaging) return;
          
          try {
            const { getToken, onMessage } = await import('firebase/messaging');
            
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
              await navigator.serviceWorker.ready;

              const currentToken = await getToken(messaging, { 
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
              });
              
              if (currentToken) {
                console.log('Web Push Token:', currentToken);
                AsyncStorage.setItem('webPushToken', currentToken);
                
                // Register token to backend if user is logged in
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                  const user = JSON.parse(userData);
                  authFetch(`${API_BASE_URL}/api/notifications/register-token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, pushToken: currentToken })
                  }).catch(e => console.error(e));
                }
              }
            }

            // Handle foreground messages
            onMessage(messaging, (payload) => {
              console.log('Message received in foreground: ', payload);
              if (Notification.permission === 'granted') {
                const title = payload.data?.title || 'Notifikasi Baru ASG';
                const body = payload.data?.body || 'Anda menerima pesan baru';
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification(title, {
                    body,
                    icon: '/icon.png',
                    badge: '/icon.png',
                    vibrate: [200, 100, 200],
                    tag: payload.data?.tag || 'asg-notification',
                    renotify: true,
                    data: payload.data || {}
                  });
                });
              }
            });

          } catch (error) {
            console.error('An error occurred while retrieving web push token. ', error);
          }
        });
      });
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#FFF" style={{ marginRight: 6 }} />
          <Text style={styles.offlineText}>⚠️ Anda sedang offline. Menampilkan data terakhir.</Text>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  offlineText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
