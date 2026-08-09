import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast, ToastType } from '../components/Toast';
import { API_BASE_URL } from '../config/api';

export default function EditProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  // User Data State
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [idRole, setIdRole] = useState(2);
  
  // Editable fields
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');

  const API_URL = `${API_BASE_URL}/api/master/users`;

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const user = JSON.parse(data);
          
          // Memuat ulang data spesifik dari backend (untuk mendapatkan kolom terbaru seperti tanggal lahir yang mungkin belum ada di session)
          const res = await fetch(API_URL);
          const allUsers = await res.json();
          const currentUser = allUsers.find((u: any) => u.id === user.id);
          
          if (currentUser) {
            setUserId(currentUser.id);
            setUsername(currentUser.username);
            setIdRole(currentUser.id_role || user.id_role || 2);
            setNamaLengkap(currentUser.nama_lengkap || currentUser.username);
            setEmail(currentUser.email || '');
            setTanggalLahir(formatDate(currentUser.tanggal_lahir) || '');
            setJenisKelamin(currentUser.jenis_kelamin || 'Laki-laki');
          } else {
            // Fallback ke data session
            setUserId(user.id);
            setUsername(user.username);
            setIdRole(user.id_role || 2);
            setNamaLengkap(user.nama_lengkap || user.username);
            setEmail(user.email || '');
          }
        }
      } catch (error) {
        showToast('Gagal memuat profil', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const handleSave = async () => {
    if (!namaLengkap || !email) {
      showToast('Nama lengkap dan email wajib diisi!', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      const payload: any = { 
        username, // username tidak diedit di sini, hanya dikirim kembali
        email, 
        nama_lengkap: namaLengkap, 
        tanggal_lahir: tanggalLahir || null,
        jenis_kelamin: jenisKelamin,
        id_role: idRole 
      };
      if (password) payload.password = password;

      const res = await fetch(`${API_URL}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan profil.', 'error');
        setSaving(false);
        return;
      }
      
      // Update session data
      const oldSession = await AsyncStorage.getItem('userData');
      if (oldSession) {
        const parsed = JSON.parse(oldSession);
        const newSession = {
          ...parsed,
          email,
          nama_lengkap: namaLengkap,
          tanggal_lahir: tanggalLahir || null,
          jenis_kelamin: jenisKelamin
        };
        await AsyncStorage.setItem('userData', JSON.stringify(newSession));
      }

      showToast('Profil berhasil diperbarui!', 'success');
      setTimeout(() => {
        router.back();
      }, 1500);
      
    } catch (error) {
      showToast('Terjadi kesalahan koneksi.', 'error');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profil</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.usernameText}>@{username}</Text>
        </View>
        
        <Text style={styles.label}>Nama Lengkap:</Text>
        <TextInput style={styles.input} placeholder="Budi Santoso" placeholderTextColor="#999" value={namaLengkap} onChangeText={setNamaLengkap} />

        <Text style={styles.label}>Email:</Text>
        <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        
        <Text style={styles.label}>Password Baru:</Text>
        <TextInput style={styles.input} placeholder="Kosongkan jika tidak ingin mengubah password" placeholderTextColor="#999" secureTextEntry value={password} onChangeText={setPassword} />
        
        <Text style={styles.label}>Tanggal Lahir:</Text>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <input 
            type="date" 
            style={{...styles.input, outline: 'none', border: '1px solid #E0D8C8'}} 
            value={tanggalLahir} 
            onChange={(e: any) => setTanggalLahir(e.target.value)} 
          />
        ) : (
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#999" value={tanggalLahir} onChangeText={setTanggalLahir} />
        )}

        <Text style={styles.label}>Jenis Kelamin:</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={jenisKelamin} onValueChange={(itemValue) => setJenisKelamin(itemValue.toString())} style={styles.picker}>
            <Picker.Item label="Laki-laki" value="Laki-laki" />
            <Picker.Item label="Perempuan" value="Perempuan" />
          </Picker>
        </View>

        <TouchableOpacity style={[styles.submitButton, saving && {opacity: 0.7}]} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#F9F6F0" size="small" />
          ) : (
            <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: Platform.OS === 'web' ? 20 : 60, borderBottomWidth: 1, borderBottomColor: '#E0D8C8', backgroundColor: '#F1EBE1'
  },
  backButton: { padding: 8, backgroundColor: 'rgba(26, 26, 26, 0.05)', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },

  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E0D8C8', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#1A1A1A' },
  usernameText: { fontSize: 16, color: '#666', fontWeight: '500' },

  formContainer: { padding: 24, flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8', color: '#1A1A1A', padding: 14, borderRadius: 12 },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 50, width: '100%', backgroundColor: 'transparent', color: '#1A1A1A', border: 'none' },
  submitButton: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#F9F6F0', fontWeight: 'bold', fontSize: 16 }
});
