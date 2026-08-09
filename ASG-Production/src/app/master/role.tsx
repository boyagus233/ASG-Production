import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL } from '../../config/api';

export default function MasterRole() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  // Form State
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState('');

  const API_URL = `${API_BASE_URL}/api/master/roles`;

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setRoles(data);
    } catch (error) {
      showToast('Gagal memuat data role.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setRoleName('');
    setIsFormVisible(false);
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setRoleName(item.role_name);
    setIsFormVisible(true);
  };

  const handleDeleteClick = (id: string) => {
    if (Platform.OS === 'web') {
      if(window.confirm('Apakah Anda yakin ingin menghapus role ini?')) {
        executeDelete(id);
      }
    } else {
      Alert.alert('Konfirmasi', 'Apakah Anda yakin ingin menghapus role ini?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => executeDelete(id) },
      ]);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Gagal menghapus role.', 'error');
        return;
      }
      showToast('Role berhasil dihapus!', 'success');
      fetchRoles();
    } catch (error) {
      showToast('Terjadi kesalahan koneksi.', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!roleName) {
      showToast('Nama role wajib diisi!', 'error');
      return;
    }
    
    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_name: roleName }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan role.', 'error');
        return;
      }
      showToast(`Role berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}!`, 'success');
      resetForm();
      fetchRoles();
    } catch (error) {
      showToast('Terjadi kesalahan koneksi.', 'error');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleIcon}>
        <Ionicons name="shield-checkmark" size={24} color="#1A1A1A" />
      </View>
      <View style={styles.roleInfo}>
        <Text style={styles.roleName} numberOfLines={1}>{item.role_name}</Text>
        <Text style={styles.roleId}>ID: {item.id}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleEditClick(item)}>
          <Ionicons name="pencil" size={20} color="#3498db" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteClick(item.id)}>
          <Ionicons name="trash" size={20} color="#e74c3c" />
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
        <Text style={styles.title}>Master Role</Text>
        <TouchableOpacity onPress={() => { resetForm(); setIsFormVisible(!isFormVisible); }} style={styles.addButton}>
          <Ionicons name={isFormVisible ? "close" : "add"} size={24} color="#F9F6F0" />
        </TouchableOpacity>
      </View>

      {isFormVisible && (
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{editingId ? 'Edit Role' : 'Tambah Role Baru'}</Text>
          <Text style={styles.label}>Nama Role:</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Contoh: Editor" 
            placeholderTextColor="#999" 
            value={roleName} 
            onChangeText={setRoleName} 
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Simpan Role</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
  
  roleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E0D8C8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  roleIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  roleInfo: { flex: 1, marginRight: 8 },
  roleName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  roleId: { fontSize: 13, color: '#666' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8, backgroundColor: '#F9F6F0', borderRadius: 8, borderWidth: 1, borderColor: '#E0D8C8' },

  formContainer: { backgroundColor: '#F1EBE1', padding: 24, borderBottomWidth: 1, borderBottomColor: '#E0D8C8' },
  formTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 6, marginTop: 10 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8', color: '#1A1A1A', padding: 14, borderRadius: 12, marginBottom: 16 },
  submitButton: { backgroundColor: '#1A1A1A', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#F9F6F0', fontWeight: 'bold', fontSize: 16 }
});
