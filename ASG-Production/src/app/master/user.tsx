import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform, ScrollView, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL, authFetch, getFileUrl } from '../../config/api';

export default function MasterUser() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  // Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [username, setUsername] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [email, setEmail] = useState('');
  const [noHp, setNoHp] = useState('');
  const [password, setPassword] = useState('');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState('Laki-laki');
  const [roleId, setRoleId] = useState('2');

  const API_URL = `${API_BASE_URL}/api/master/users`;
  const ROLE_API_URL = `${API_BASE_URL}/api/master/roles`;

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  const openWhatsApp = (phone?: string | null) => {
    if (!phone) return;
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
    if (Platform.OS === 'web') {
      window.open(`https://wa.me/${cleaned}`, '_blank');
    } else {
      Linking.openURL(`https://wa.me/${cleaned}`);
    }
  };

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        authFetch(API_URL),
        authFetch(ROLE_API_URL)
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
    } catch (error) {
      showToast('Gagal memuat data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setUsername('');
    setNamaLengkap('');
    setEmail('');
    setNoHp('');
    setPassword('');
    setTanggalLahir('');
    setJenisKelamin('Laki-laki');
    setRoleId('2');
    setIsFormVisible(false);
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setUsername(item.username || '');
    setNamaLengkap(item.nama_lengkap || item.username || '');
    setEmail(item.email || '');
    setNoHp(item.no_hp || '');
    setTanggalLahir(formatDate(item.tanggal_lahir) || '');
    setJenisKelamin(item.jenis_kelamin || 'Laki-laki');
    setRoleId(item.id_role ? item.id_role.toString() : '2');
    setPassword(''); 
    setIsFormVisible(true);
  };

  const handleDeleteClick = (id: string) => {
    if (Platform.OS === 'web') {
      if(window.confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        executeDelete(id);
      }
    } else {
      Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin menghapus user ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => executeDelete(id) },
      ]);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Gagal menghapus user.', 'error');
        return;
      }
      showToast('User berhasil dihapus!', 'success');
      fetchData();
    } catch (error) {
      showToast('Terjadi kesalahan koneksi.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!username || !email || !namaLengkap) {
      showToast('Username, Nama Lengkap, dan Email wajib diisi!', 'error');
      return;
    }
    
    if (!editingId && !password) {
      showToast('Password wajib diisi untuk user baru!', 'error');
      return;
    }
    
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';
      
      const payload: any = { 
        username, 
        email, 
        nama_lengkap: namaLengkap, 
        no_hp: noHp.trim() || null,
        tanggal_lahir: tanggalLahir || null,
        jenis_kelamin: jenisKelamin,
        id_role: parseInt(roleId) 
      };
      if (password) payload.password = password;

      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan user.', 'error');
        return;
      }
      showToast(`User berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!`, 'success');
      resetForm();
      fetchData();
    } catch (error) {
      showToast('Terjadi kesalahan koneksi.', 'error');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.avatarBox}>
        {item.avatar_url ? (
          <Image source={{ uri: getFileUrl(item.avatar_url) }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>{item.nama_lengkap || item.username}</Text>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email || '-'}</Text>
        
        {/* Nomor WhatsApp / Telepon */}
        {item.no_hp ? (
          <TouchableOpacity 
            style={styles.phoneBadge} 
            onPress={() => openWhatsApp(item.no_hp)}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
            <Text style={styles.phoneText}>{item.no_hp}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPhoneBadge}>
            <Ionicons name="call-outline" size={12} color="#999" />
            <Text style={styles.noPhoneText}>Belum ada nomor HP</Text>
          </View>
        )}

        <Text style={styles.userSubText} numberOfLines={1}>
          {item.jenis_kelamin || '-'} • {formatDate(item.tanggal_lahir) || '-'}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.role_name}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        {item.no_hp ? (
          <TouchableOpacity 
            style={[styles.actionBtn, styles.waActionBtn]} 
            onPress={() => openWhatsApp(item.no_hp)}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditClick(item)}>
          <Ionicons name="pencil" size={18} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteClick(item.id)}>
          <Ionicons name="trash" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.title}>Master User</Text>
        <TouchableOpacity onPress={() => { resetForm(); setIsFormVisible(!isFormVisible); }} style={styles.addButton}>
          <Ionicons name={isFormVisible ? "close" : "add"} size={24} color="#F9F6F0" />
        </TouchableOpacity>
      </View>

      {isFormVisible ? (
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>{editingId ? 'Edit User' : 'Tambah User Baru'}</Text>
          
          <Text style={styles.label}>Username:</Text>
          <TextInput style={styles.input} placeholder="Masukkan username" placeholderTextColor="#999" value={username} onChangeText={setUsername} autoCapitalize="none" />
          
          <Text style={styles.label}>Nama Lengkap:</Text>
          <TextInput style={styles.input} placeholder="Masukkan nama lengkap" placeholderTextColor="#999" value={namaLengkap} onChangeText={setNamaLengkap} />

          <Text style={styles.label}>Email:</Text>
          <TextInput style={styles.input} placeholder="Masukkan email" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          
          <Text style={styles.label}>Nomor WhatsApp / Telepon:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Contoh: 081234567890" 
            placeholderTextColor="#999" 
            value={noHp} 
            onChangeText={setNoHp} 
            keyboardType="phone-pad" 
          />

          <Text style={styles.label}>Password:</Text>
          <TextInput style={styles.input} placeholder={editingId ? "Kosongkan jika tidak diubah" : "Masukkan password"} placeholderTextColor="#999" secureTextEntry value={password} onChangeText={setPassword} />
          
          <Text style={styles.label}>Tanggal Lahir:</Text>
          {Platform.OS === 'web' ? (
            // @ts-ignore
            <input
              type="date"
              value={tanggalLahir}
              onChange={(e: any) => setTanggalLahir(e.target.value)}
              style={{
                backgroundColor: '#F9F6F0',
                borderWidth: '1px',
                borderColor: '#E0D8C8',
                color: '#1A1A1A',
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '20px',
                fontSize: '15px',
                width: '100%',
                boxSizing: 'border-box'
              }}
            />
          ) : (
            <TextInput style={styles.input} placeholder="Contoh: 2000-12-31" placeholderTextColor="#999" value={tanggalLahir} onChangeText={setTanggalLahir} />
          )}

          <Text style={styles.label}>Jenis Kelamin:</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={jenisKelamin} onValueChange={(itemValue) => setJenisKelamin(itemValue.toString())} style={styles.picker}>
              <Picker.Item label="Laki-laki" value="Laki-laki" />
              <Picker.Item label="Perempuan" value="Perempuan" />
            </Picker>
          </View>

          <Text style={styles.label}>Role:</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={roleId} onValueChange={(itemValue) => setRoleId(itemValue.toString())} style={styles.picker}>
              {roles.map((role) => (
                <Picker.Item key={role.id} label={role.role_name} value={role.id.toString()} />
              ))}
            </Picker>
          </View>
          
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Simpan User</Text>
          </TouchableOpacity>
          <View style={{height: 40}} />
        </ScrollView>
      ) : (
        loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1A1A1A" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: Platform.OS === 'web' ? 20 : 60, borderBottomWidth: 1, borderBottomColor: '#E0D8C8', backgroundColor: '#F1EBE1'
  },
  backButton: { padding: 8, backgroundColor: 'rgba(26, 26, 26, 0.05)', borderRadius: 12 },
  addButton: { padding: 8, backgroundColor: '#1A1A1A', borderRadius: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  listContent: { padding: 20, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  userCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E0D8C8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  avatarBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 12, overflow: 'hidden' },
  avatarImg: { width: 50, height: 50, borderRadius: 25 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  userInfo: { flex: 1, marginRight: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 2 },
  userEmail: { fontSize: 12, color: '#666', marginBottom: 3 },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  phoneText: { fontSize: 12, color: '#2E7D32', fontWeight: 'bold' },
  noPhoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  noPhoneText: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  userSubText: { fontSize: 11, color: '#888', marginTop: 2 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  badgeText: { fontSize: 10, color: '#2E7D32', fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn: { padding: 8, backgroundColor: '#F9F6F0', borderRadius: 8, borderWidth: 1, borderColor: '#E0D8C8' },
  waActionBtn: { backgroundColor: '#E8F5E9', borderColor: '#C8E6C9' },

  formContainer: { backgroundColor: '#F1EBE1', padding: 24, flex: 1 },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8', color: '#1A1A1A', padding: 12, borderRadius: 12 },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 12, overflow: 'hidden' },
  picker: { height: 48, width: '100%', backgroundColor: 'transparent', color: '#1A1A1A', border: 'none' },
  submitButton: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  submitButtonText: { color: '#F9F6F0', fontWeight: 'bold', fontSize: 16 }
});
