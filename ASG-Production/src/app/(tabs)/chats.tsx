import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL } from '../../config/api';

export default function ChatsScreen() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  // Modal State Pembuatan Grup
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [groupDate, setGroupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupLocation, setGroupLocation] = useState('LOK Tanggerang');

  // Pipeline Filter Pemilihan Anggota (Role -> Member -> Add List)
  const [roles, setRoles] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const finalGroupName = `${formatIndoDate(groupDate)} ${groupLocation.trim()}`;

  useEffect(() => {
    loadUserAndData();
    // Minta izin notifikasi browser jika tersedia
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  const loadUserAndData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);
        await Promise.all([
          fetchGroups(u.id),
          fetchPendingInvitations(u.id),
          fetchUsersAndRoles()
        ]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups?userId=${userId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      showToast('Gagal memuat daftar grup', 'error');
    }
  };

  const fetchPendingInvitations = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/invitations/pending?userId=${userId}`);
      const data = await res.json();
      setInvitations(data);

      // Memicu notifikasi HP asli jika ada undangan baru
      if (data.length > 0 && Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Tawaran Job Baru! 💼', {
            body: `Anda mendapatkan ${data.length} tawaran job baru. Buka aplikasi untuk menerima/menolak.`,
          });
        }
      }
    } catch (error) {
      // silent
    }
  };

  const fetchUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/master/users`),
        fetch(`${API_BASE_URL}/api/master/roles`)
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setAllUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to fetch users or roles');
    }
  };

  // Respon Anggota terhadap Undangan (ACCEPT / REJECT)
  const handleRespondInvitation = async (invitationId: number, action: 'ACCEPT' | 'REJECT', groupName: string) => {
    try {
      showToast(`Memproses respon ${action === 'ACCEPT' ? 'Terima' : 'Tolak'}...`, 'info');

      const res = await fetch(`${API_BASE_URL}/api/groups/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user.id }),
      });

      const data = await res.json();

      if (res.ok) {
        if (action === 'ACCEPT') {
          showToast(`Berhasil bergabung ke ${groupName}! 🎉`, 'success');
        } else {
          showToast(`Job ${groupName} telah ditolak.`, 'info');
        }
        // Refresh data grup dan undangan
        fetchGroups(user.id);
        fetchPendingInvitations(user.id);
      } else {
        showToast(data.error || 'Gagal memproses respon', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan koneksi', 'error');
    }
  };

  // Tambah Member ke List Sementara Form Modal
  const handleAddMemberToList = () => {
    if (!selectedMemberId) {
      showToast('Pilih nama lengkap member terlebih dahulu!', 'error');
      return;
    }

    const targetUser = allUsers.find(u => u.id.toString() === selectedMemberId);
    if (!targetUser) return;

    if (selectedMembers.some(m => m.id === targetUser.id)) {
      showToast('User ini sudah ditambahkan ke daftar!', 'info');
      return;
    }

    setSelectedMembers(prev => [...prev, targetUser]);
    setSelectedMemberId('');
    showToast(`${targetUser.nama_lengkap || targetUser.username} ditambahkan`, 'success');
  };

  const handleRemoveMemberFromList = (userId: number) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupLocation.trim()) {
      showToast('Lokasi acara tidak boleh kosong!', 'error');
      return;
    }

    try {
      const memberIds = selectedMembers.map(m => m.id);
      const res = await fetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalGroupName, owner_id: user.id, member_ids: memberIds }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data.error || 'Gagal membuat grup', 'error');
        return;
      }
      
      showToast('Grup & Undangan Job berhasil dibuat!', 'success');
      setGroupLocation('LOK Tanggerang');
      setSelectedMembers([]);
      setSelectedRole('ALL');
      setSelectedMemberId('');
      setIsModalVisible(false);
      fetchGroups(user.id);
    } catch (error) {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    const confirmDelete = () => {
      fetch(`${API_BASE_URL}/api/groups/${groupId}?userId=${user.id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            showToast(data.error, 'error');
          } else {
            showToast('Grup diselesaikan & diarsipkan ke Riwayat!', 'success');
            fetchGroups(user.id);
          }
        })
        .catch(() => showToast('Gagal menghapus grup', 'error'));
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Apakah Anda yakin ingin MENYELESAIKAN & MENGHAPUS grup "${groupName}"?\nGrup akan diarsipkan ke Riwayat Job Selesai Admin.`)) {
        confirmDelete();
      }
    } else {
      Alert.alert('Selesaikan Job & Hapus Grup', `Apakah Anda yakin ingin menyelesaikan grup "${groupName}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Selesaikan & Hapus', style: 'destructive', onPress: confirmDelete }
      ]);
    }
  };

  const filteredUsersForDropdown = allUsers.filter(u => {
    if (u.id === user?.id) return false; // Jangan tampilkan diri sendiri
    if (selectedRole !== 'ALL' && u.id_role?.toString() !== selectedRole) return false;
    return true;
  });

  const renderGroupItem = ({ item }: { item: any }) => {
    const isOwner = item.owner_id === user?.id;

    return (
      <TouchableOpacity
        style={styles.groupCard}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.id, name: item.name } })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.groupInfo}>
          <View style={styles.groupHeaderRow}>
            <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
            {isOwner && (
              <TouchableOpacity onPress={() => handleDeleteGroup(item.id, item.name)} style={styles.deleteBtn}>
                <Ionicons name="archive" size={18} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.groupSub}>
            {item.member_count} Anggota • {isOwner ? 'Pembuat Grup' : 'Anggota'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Obrolan Job ASG</Text>
          <Text style={styles.welcomeText}>Halo, {user?.nama_lengkap || user?.username} ({user?.role_name || 'Member'})</Text>
        </View>
        {(user?.id_role === 1 || user?.id_role === 2) && (
          <TouchableOpacity style={styles.createBtn} onPress={() => setIsModalVisible(true)}>
            <Ionicons name="add" size={24} color="#F9F6F0" />
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL BUAT GRUP BARU */}
      {isModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buat Grup Job Baru</Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>1. Tanggal Acara / Job:</Text>
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <input
                  type="date"
                  value={groupDate}
                  onChange={(e: any) => setGroupDate(e.target.value)}
                  style={{
                    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0D8C8',
                    fontSize: 14, backgroundColor: '#F9F6F0', marginBottom: 14, width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
              ) : (
                <TextInput style={styles.modalInput} value={groupDate} onChangeText={setGroupDate} placeholder="YYYY-MM-DD" />
              )}

              <Text style={styles.inputLabel}>2. Lokasi Acara / Job:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Contoh: LOK Tanggerang / LOK Gedung A"
                placeholderTextColor="#999"
                value={groupLocation}
                onChangeText={setGroupLocation}
              />

              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Hasil Nama Grup Resmi:</Text>
                <Text style={styles.previewTitle}>"{finalGroupName}"</Text>
              </View>

              <Text style={styles.inputLabel}>3. Filter Role Anggota:</Text>
              <View style={styles.pickerWrapper}>
                {Platform.OS === 'web' ? (
                  // @ts-ignore
                  <select
                    value={selectedRole}
                    onChange={(e: any) => setSelectedRole(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', backgroundColor: '#F9F6F0', fontSize: 14 }}
                  >
                    <option value="ALL">Semua Role</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id.toString()}>{r.role_name}</option>
                    ))}
                  </select>
                ) : (
                  <Text style={{ padding: 10 }}>Pilih Role di Web</Text>
                )}
              </View>

              <Text style={styles.inputLabel}>4. Pilih Member (Nama Lengkap):</Text>
              <View style={styles.pickerWrapper}>
                {Platform.OS === 'web' ? (
                  // @ts-ignore
                  <select
                    value={selectedMemberId}
                    onChange={(e: any) => setSelectedMemberId(e.target.value)}
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: 'none', backgroundColor: '#F9F6F0', fontSize: 14 }}
                  >
                    <option value="">-- Pilih Member --</option>
                    {filteredUsersForDropdown.map(u => (
                      <option key={u.id} value={u.id.toString()}>{u.nama_lengkap || u.username} ({u.role_name || 'Anggota'})</option>
                    ))}
                  </select>
                ) : (
                  <Text style={{ padding: 10 }}>Pilih Member di Web</Text>
                )}
              </View>

              <TouchableOpacity style={styles.addToListBtn} onPress={handleAddMemberToList}>
                <Ionicons name="person-add" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.addToListBtnText}>Tambah Ke Daftar Undangan</Text>
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Daftar Anggota Diundang ({selectedMembers.length}):</Text>
              {selectedMembers.length === 0 ? (
                <Text style={styles.emptyMembersText}>Belum ada anggota dipilih.</Text>
              ) : (
                <View style={styles.chipContainer}>
                  {selectedMembers.map(m => (
                    <View key={m.id} style={styles.memberChip}>
                      <Text style={styles.chipText}>{m.nama_lengkap || m.username}</Text>
                      <TouchableOpacity onPress={() => handleRemoveMemberFromList(m.id)}>
                        <Ionicons name="close-circle" size={18} color="#FF3B30" style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCreateGroup}>
                <Text style={styles.saveBtnText}>Buat & Kirim Undangan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* LIST KARTU UNDANGAN JOB PENDING (JIKA ADA) */}
      {invitations.length > 0 && (
        <View style={styles.invitationSection}>
          <Text style={styles.invitationSectionTitle}>💼 Tawaran Job Baru ({invitations.length})</Text>
          {invitations.map((inv) => (
            <View key={inv.invitation_id} style={styles.invitationCard}>
              <View style={styles.invitationHeader}>
                <Ionicons name="briefcase-outline" size={22} color="#1A1A1A" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.invitationTitle}>{inv.group_name}</Text>
                  <Text style={styles.invitationSub}>Oleh: {inv.owner_name || 'Admin'}</Text>
                </View>
              </View>
              <Text style={styles.invitationPrompt}>Apakah Anda bersedia mengikuti job ini?</Text>
              <View style={styles.invitationActions}>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleRespondInvitation(inv.invitation_id, 'REJECT', inv.group_name)}
                >
                  <Ionicons name="close-circle" size={18} color="#FF3B30" style={{ marginRight: 4 }} />
                  <Text style={styles.rejectBtnText}>Tolak</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleRespondInvitation(inv.invitation_id, 'ACCEPT', inv.group_name)}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.acceptBtnText}>Terima Job</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* LIST GRUP AKTIF */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Belum Ada Obrolan Job</Text>
          <Text style={styles.emptySub}>Klik ikon (+) di atas atau tunggu tawaran job untuk bergabung.</Text>
        </View>
      ) : (
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderGroupItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function formatIndoDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const day = parseInt(parts[2], 10);
  const month = months[parseInt(parts[1], 10) - 1] || '';
  const year = parts[0];
  return `${day} ${month} ${year}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#F9F6F0', borderBottomWidth: 1, borderBottomColor: '#E0D8C8',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  welcomeText: { fontSize: 13, color: '#666', marginTop: 2 },
  createBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },

  // Invitations
  invitationSection: { padding: 16, backgroundColor: '#FFF3E0', borderBottomWidth: 1, borderBottomColor: '#FFE0B2' },
  invitationSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#E65100', marginBottom: 10 },
  invitationCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#FFE0B2', marginBottom: 8 },
  invitationHeader: { flexDirection: 'row', alignItems: 'center' },
  invitationTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  invitationSub: { fontSize: 12, color: '#666' },
  invitationPrompt: { fontSize: 13, color: '#444', marginVertical: 8 },
  invitationActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FF3B30', backgroundColor: '#FFF' },
  rejectBtnText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 13 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#4CAF50' },
  acceptBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  // Groups
  listContainer: { padding: 20 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0D8C8',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A' },
  groupInfo: { flex: 1 },
  groupHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', flex: 1, marginRight: 8 },
  deleteBtn: { padding: 6 },
  groupSub: { fontSize: 12, color: '#888', marginTop: 4 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginTop: 16 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 8 },

  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 450, backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#444', marginBottom: 6, marginTop: 10 },
  modalInput: { backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 10, padding: 12, fontSize: 14, color: '#1A1A1A' },
  previewBox: { backgroundColor: '#F1EBE1', padding: 12, borderRadius: 12, marginVertical: 8, borderWidth: 1, borderColor: '#E0D8C8' },
  previewLabel: { fontSize: 11, color: '#888', fontWeight: 'bold' },
  previewTitle: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginTop: 2 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 10, backgroundColor: '#F9F6F0', overflow: 'hidden' },
  addToListBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', padding: 10, borderRadius: 10, marginTop: 10 },
  addToListBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  emptyMembersText: { fontSize: 12, color: '#999', fontStyle: 'italic', marginVertical: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1EBE1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E0D8C8' },
  chipText: { fontSize: 12, color: '#1A1A1A', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#F1EBE1' },
  cancelBtnText: { color: '#666', fontWeight: 'bold' },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#1A1A1A' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' },
});
