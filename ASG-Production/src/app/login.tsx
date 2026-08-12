import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast, ToastType } from '../components/Toast';
import { API_BASE_URL } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

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

  const handleLogin = async () => {
    if (!email || !password) {
      showToast('Email dan password tidak boleh kosong!', 'error');
      return;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showToast(data.error || 'Gagal login!', 'error');
        return;
      }

      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      // Register push token if available
      try {
        const pushToken = await AsyncStorage.getItem('pushToken');
        if (pushToken) {
          await fetch(`${API_BASE_URL}/api/notifications/register-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
      
    } catch (error) {
      console.error(error);
      showToast('Tidak dapat terhubung ke server.', 'error');
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
    <View style={styles.background}>
      <View style={styles.overlay}>
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

          <TouchableOpacity onPress={() => router.push('/signup')} style={styles.linkContainer}>
            <Text style={styles.linkText}>Belum menjadi anggota? <Text style={styles.linkBold}>Daftar</Text></Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  overlay: {
    flex: 1,
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
  }
});
