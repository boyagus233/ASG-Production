import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Capacitor } from '@capacitor/core';
import { Toast, ToastType } from '../components/Toast';
import { API_BASE_URL, getApiBaseUrl } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });
  const [debugLog, setDebugLog] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      if (userToken && userData) {
        router.replace('/(tabs)/chats');
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const API_URL = `${API_BASE_URL}/api/auth/login`;

  const testDirectConnection = async () => {
    setTestingConnection(true);
    setDebugLog(`[TEST KONEKSI]\nTarget: ${API_BASE_URL}\nMemulai fetch...`);
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(`${API_BASE_URL}/`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const text = await res.text();
      const duration = Date.now() - startTime;
      setDebugLog(`[SUCCESS] (${duration}ms)\nStatus: ${res.status} ${res.statusText}\nBody: ${text.slice(0, 100)}`);
      showToast(`Koneksi Sukses! (${duration}ms)`, 'success');
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const errDetail = `[ERROR] (${duration}ms)\nName: ${err?.name || 'Unknown'}\nMsg: ${err?.message || String(err)}\nTarget URL: ${API_BASE_URL}`;
      console.error(errDetail);
      setDebugLog(errDetail);
      showToast(`Gagal: ${err?.message || 'Error'}`, 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Email dan password tidak boleh kosong!', 'error');
      return;
    }
    
    setDebugLog(`[LOGIN ATTEMPT]\nTarget: ${API_URL}\nUsername/Email: ${email}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (!response.ok) {
        setDebugLog(`[LOGIN FAILED]\nStatus: ${response.status}\nResponse: ${JSON.stringify(data)}`);
        showToast(data.error || 'Gagal login!', 'error');
        return;
      }

      setDebugLog(`[LOGIN SUCCESS]\nUser: ${data.user?.username}`);
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      
      try {
        let pushToken: string | null = null;
        if (Capacitor.isNativePlatform()) {
          try {
            const { PushNotifications } = await import('@capacitor/push-notifications');
            let nativeToken = await AsyncStorage.getItem('nativePushToken');
            if (!nativeToken) {
              await new Promise<void>((resolve) => {
                let resolved = false;
                let listenerHandler: any = null;

                PushNotifications.addListener('registration', (token) => {
                  nativeToken = token.value;
                  AsyncStorage.setItem('nativePushToken', token.value);
                  if (listenerHandler) listenerHandler.remove();
                  if (!resolved) { resolved = true; resolve(); }
                }).then(h => { listenerHandler = h; });

                PushNotifications.requestPermissions().then(perm => {
                  if (perm.receive === 'granted') {
                    PushNotifications.register();
                  } else {
                    if (!resolved) { resolved = true; resolve(); }
                  }
                }).catch(() => { if (!resolved) { resolved = true; resolve(); } });

                setTimeout(() => {
                  if (!resolved) { resolved = true; resolve(); }
                }, 3000);
              });
            }
            pushToken = nativeToken || await AsyncStorage.getItem('nativePushToken');
          } catch (err) {
            console.error('Error registering native push on login:', err);
          }
        } else {
          pushToken = await AsyncStorage.getItem('webPushToken');
          if (!pushToken) {
            try {
              const { getFirebaseMessaging, VAPID_KEY } = await import('../config/firebase-web');
              const messaging = await getFirebaseMessaging();
              if (messaging && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                const { getToken } = await import('firebase/messaging');
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
                await navigator.serviceWorker.ready;
                pushToken = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
                if (pushToken) await AsyncStorage.setItem('webPushToken', pushToken);
              }
            } catch (err) {
              console.error('Error fetching web push token on login:', err);
            }
          }
        }

        if (pushToken) {
          console.log('Registering push token for user:', data.user.id, pushToken);
          const targetUrl = getApiBaseUrl();
          await fetch(`${targetUrl}/api/notifications/register-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.token}`
            },
            body: JSON.stringify({ userId: data.user.id, pushToken })
          });
        }
      } catch (e) {
        console.error('Failed to register push token after login:', e);
      }

      showToast('Login berhasil! Mengalihkan...', 'success');
      setTimeout(() => {
        router.replace('/(tabs)/chats');
      }, 1000);
      
    } catch (error: any) {
      const detail = `[LOGIN EXCEPTION]\nTarget: ${API_URL}\nName: ${error?.name}\nMessage: ${error?.message || String(error)}`;
      console.error(detail);
      setDebugLog(detail);
      showToast(`Error: ${error?.message || 'Tidak dapat terhubung ke server.'}`, 'error');
    }
  };

  if (checkingAuth) {
    return (
      <View style={[styles.background, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.background} 
      contentContainerStyle={styles.scrollContent} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onHide={() => setToast({ ...toast, visible: false })} 
      />
      
      <View style={styles.glassContainer}>
        <Text style={styles.title}>ASG Production</Text>
        <Text style={styles.subtitle}>SANGGAR SENI</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username / Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
          <Text style={styles.buttonText}>MASUK</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#4A5568', marginTop: 10 }]} 
          onPress={testDirectConnection} 
          disabled={testingConnection}
          activeOpacity={0.8}
        >
          {testingConnection ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>🔍 TES KONEKSI SERVER</Text>
          )}
        </TouchableOpacity>

        {debugLog ? (
          <View style={styles.debugBox}>
            <Text style={styles.debugTitle}>📋 DEBUG NETWORK LOG:</Text>
            <Text style={styles.debugText} selectable>{debugLog}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={() => router.push('/signup')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Belum menjadi anggota? <Text style={styles.linkBold}>Daftar</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A', // Dark text matching logo
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    letterSpacing: 4,
    marginBottom: 40,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#F9F6F0',
    borderWidth: 1,
    borderColor: '#E0D8C8',
    color: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#F9F6F0',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  linkContainer: {
    marginTop: 24,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  debugBox: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  debugTitle: {
    color: '#00FF66',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 4,
  },
  debugText: {
    color: '#FFCC00',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  }
});
