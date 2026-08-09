import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Toast, ToastType } from '../components/Toast';
import { API_BASE_URL } from '../config/api';

export default function SignUp() {
  const [username, setUsername] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const API_URL = `${API_BASE_URL}/api/auth/signup`;

  const handleSignUp = async () => {
    if (!username || !email || !password || !namaLengkap) {
      showToast('Username, nama, email, dan password wajib diisi!', 'error');
      return;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          email, 
          password, 
          nama_lengkap: namaLengkap, 
          tanggal_lahir: tanggalLahir || null, 
          jenis_kelamin: jenisKelamin 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showToast(data.error || 'Gagal mendaftar!', 'error');
        return;
      }
      
      showToast('Akun berhasil dibuat! Mengalihkan...', 'success');
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error(error);
      showToast('Tidak dapat terhubung ke server backend.', 'error');
    }
  };

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
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{flexGrow: 1, justifyContent: 'center'}}>
            <Text style={styles.title}>Daftar Anggota</Text>
            <Text style={styles.subtitle}>GABUNG ASG PRODUCTION</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput style={styles.input} placeholder="Contoh: budi123" placeholderTextColor="#888" value={username} onChangeText={setUsername} autoCapitalize="none" />
              
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput style={styles.input} placeholder="Budi Santoso" placeholderTextColor="#888" value={namaLengkap} onChangeText={setNamaLengkap} />
              
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="budi@email.com" placeholderTextColor="#888" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="Minimal 6 karakter" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
              
              <Text style={styles.label}>Tanggal Lahir (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="Contoh: 2000-12-31" placeholderTextColor="#888" value={tanggalLahir} onChangeText={setTanggalLahir} />
              
              <Text style={styles.label}>Jenis Kelamin</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={jenisKelamin} onValueChange={(v) => setJenisKelamin(v)} style={styles.picker}>
                  <Picker.Item label="Laki-laki" value="Laki-laki" />
                  <Picker.Item label="Perempuan" value="Perempuan" />
                </Picker>
              </View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp} activeOpacity={0.8}>
              <Text style={styles.buttonText}>DAFTAR</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={styles.linkContainer}>
              <Text style={styles.linkText}>Sudah menjadi anggota? <Text style={styles.linkBold}>Login</Text></Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#F9F6F0' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  glassContainer: { width: '100%', maxWidth: 450, backgroundColor: '#FFF', padding: 30, borderRadius: 24, borderWidth: 1, borderColor: '#E0D8C8', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 10, maxHeight: '90%' },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#666', letterSpacing: 2, marginBottom: 20, textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 6, marginTop: 10 },
  input: { width: '100%', backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0D8C8', color: '#1A1A1A', padding: 12, borderRadius: 12, fontSize: 14 },
  pickerContainer: { backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 48, width: '100%', backgroundColor: 'transparent', color: '#1A1A1A', border: 'none' },
  button: { width: '100%', backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#1A1A1A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, marginTop: 10 },
  buttonText: { color: '#F9F6F0', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  linkContainer: { marginTop: 24, alignSelf: 'center' },
  linkText: { color: '#666', fontSize: 14 },
  linkBold: { color: '#1A1A1A', fontWeight: 'bold' }
});
