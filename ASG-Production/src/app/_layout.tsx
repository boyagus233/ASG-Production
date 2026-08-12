import { Stack, router, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

export default function RootLayout() {
  const pathname = usePathname();

  useEffect(() => {
    let backListener: any;
    if (Platform.OS === 'web') {
      const setup = async () => {
        backListener = await App.addListener('backButton', () => {
          // Hanya keluar aplikasi jika di halaman akar
          const isRootPage = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname === '/chats' || pathname === '/dashboard' || pathname === '/master' || pathname === '/settings';
          
          if (isRootPage) {
            App.exitApp();
          } else {
            router.back();
          }
        });
      };
      setup();
    }
    return () => {
      if (backListener) backListener.remove();
    };
  }, [pathname]);

  useEffect(() => {
    if (Platform.OS === 'web') {

      // Firebase Push Notifications
      PushNotifications.requestPermissions().then(result => {
        if (result.receive === 'granted') {
          PushNotifications.register();
        }
      });

      PushNotifications.addListener('registration', (token) => {
        AsyncStorage.setItem('pushToken', token.value);
        AsyncStorage.getItem('userData').then(data => {
          if (data) {
            const user = JSON.parse(data);
            fetch(`${API_BASE_URL}/api/notifications/register-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, pushToken: token.value })
            }).catch(e => console.error(e));
          }
        });
      });

      PushNotifications.addListener('registrationError', (error) => {
        alert('Gagal mendaftar Notifikasi: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // Optional: show local toast if in foreground, but OS handles banner anyway
      });
    }
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
