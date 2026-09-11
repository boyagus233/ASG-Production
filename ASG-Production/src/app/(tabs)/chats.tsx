import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Capacitor } from '@capacitor/core';
import { router, useFocusEffect } from 'expo-router';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { socket } from '../../services/socket';

export default function ChatsScreen() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State Pembuatan Grup
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [groupDate, setGroupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [groupLocation, setGroupLocation] = useState('LOK Tanggerang');

  // Briefing & Rundown Inputs
  const [callTime, setCallTime] = useState('');
  const [showTime, setShowTime] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [dresscode, setDresscode] = useState('');
  const [rundownNotes, setRundownNotes] = useState('');

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

  useFocusEffect(
    useCallback(() => {
      loadUserAndData();
    }, [])
  );

  useEffect(() => {
    if (!user?.id) return;

    // ⚡ JOIN PERSONAL USER ROOM UNTUK NOTIFIKASI REAL-TIME
    socket.emit('join_user', user.id);

    // ⚡ LISTEN NOTIFIKASI JOB BARU KHUSUS UNTUK HP MEMBER (REAL-TIME)
    socket.on('new_job_invitation', (notif: { title: string; body: string }) => {
      showToast(`${notif.title}\n${notif.body}`, 'info');

      // Tampilkan Notifikasi Bilah Sistem HP / Browser
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(notif.title, {
            body: notif.body,
            icon: '/favicon.png'
          });
        }
      }
      fetchPendingInvitations(user.id);
      fetchUnreadCount(user.id);
    });

    socket.on('update_groups', () => {
      fetchGroups(user.id);
    });

    socket.on('update_invitations', () => {
      fetchPendingInvitations(user.id);
    });

    // Minta izin notifikasi browser jika belum disetujui
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    return () => {
      socket.off('new_job_invitation');
      socket.off('update_groups');
      socket.off('update_invitations');
    };
  }, [user?.id]);

  const loadUserAndData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);

        // Auto-register push token on APK / Native
        if (Capacitor.isNativePlatform()) {
          (async () => {
            try {
              let token = await AsyncStorage.getItem('nativePushToken');
              if (!token) {
                const { PushNotifications } = await import('@capacitor/push-notifications');
                const perm = await PushNotifications.requestPermissions();
                if (perm.receive === 'granted') {
                  PushNotifications.register();
                }
              } else {
                authFetch(`${API_BASE_URL}/api/notifications/register-token`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: u.id, pushToken: token })
                }).catch(() => {});
              }
            } catch (e) {}
          })();
        }

        await Promise.all([
          fetchGroups(u.id),
          fetchPendingInvitations(u.id),
          fetchUnreadCount(u.id),
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
      const res = await authFetch(`${API_BASE_URL}/api/groups?userId=${userId}`);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
      AsyncStorage.setItem(`cache_groups_${userId}`, JSON.stringify(Array.isArray(data) ? data : []));
    } catch (error) {
      const cached = await AsyncStorage.getItem(`cache_groups_${userId}`);
      if (cached) setGroups(JSON.parse(cached));
      else showToast('Anda sedang offline', 'error');
    }
  };

  const fetchPendingInvitations = async (userId: string) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/groups/invitations/pending?userId=${userId}`);
      const data = await res.json();
      setInvitations(data);
      AsyncStorage.setItem(`cache_invitations_${userId}`, JSON.stringify(data));
    } catch (error) {
      const cached = await AsyncStorage.getItem(`cache_invitations_${userId}`);
      if (cached) setInvitations(JSON.parse(cached));
    }
  };

  const fetchUnreadCount = async (userId: string) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/notifications?userId=${userId}`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : (json.data || []);
        const count = items.filter((n: any) => !n.is_read).length;
        setUnreadCount(count);
        AsyncStorage.setItem(`cache_unread_${userId}`, count.toString());
      }
    } catch (error) {
      const cached = await AsyncStorage.getItem(`cache_unread_${userId}`);
      if (cached) setUnreadCount(parseInt(cached));
    }
  };

  const fetchUsersAndRoles = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/master/users`),
        authFetch(`${API_BASE_URL}/api/master/roles`)
      ]);
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      const activeRoles = rolesData.filter((r: any) => 
        usersData.some((u: any) => u.id_role === r.id)
      );

      setAllUsers(usersData);
      setRoles(activeRoles);
      
      AsyncStorage.setItem('cache_users', JSON.stringify(usersData));
      AsyncStorage.setItem('cache_roles', JSON.stringify(activeRoles));
    } catch (error) {
      const cachedUsers = await AsyncStorage.getItem('cache_users');
      const cachedRoles = await AsyncStorage.getItem('cache_roles');
      if (cachedUsers) setAllUsers(JSON.parse(cachedUsers));
      if (cachedRoles) setRoles(JSON.parse(cachedRoles));
    }
  };

  const handleRespondInvitation = async (invitationId: number, action: 'ACCEPT' | 'REJECT', groupName: string) => {
    if (Platform.OS === 'web' && !navigator.onLine) {
      showToast('Fitur ini membutuhkan koneksi internet', 'error');
      return;
    }
    
    try {
      showToast(`Memproses respon ${action === 'ACCEPT' ? 'Terima' : 'Tolak'}...`, 'info');

      const res = await authFetch(`${API_BASE_URL}/api/groups/invitations/${invitationId}/respond`, {
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
        fetchGroups(user.id);
        fetchPendingInvitations(user.id);
      } else {
        showToast(data.error || 'Gagal memproses respon', 'error');
      }
    } catch (error) {
      showToast('Terjadi kesalahan koneksi', 'error');
    }
  };

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
    if (Platform.OS === 'web' && !navigator.onLine) {
      showToast('Fitur ini membutuhkan koneksi internet', 'error');
      return;
    }

    if (!groupLocation.trim()) {
      showToast('Lokasi acara tidak boleh kosong!', 'error');
      return;
    }

    try {
      const memberIds = selectedMembers.map(m => m.id);
      const res = await authFetch(`${API_BASE_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: finalGroupName,
          owner_id: user.id,
          member_ids: memberIds,
          event_date: groupDate,
          call_time: callTime,
          show_time: showTime,
          venue_address: venueAddress,
          dresscode: dresscode,
          rundown_notes: rundownNotes,
        }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        showToast(data.error || 'Gagal membuat grup', 'error');
        return;
      }
      
      showToast('Grup & Undangan Job berhasil dibuat!', 'success');
      setGroupLocation('LOK Tanggerang');
      setCallTime('');
      setShowTime('');
      setVenueAddress('');
      setDresscode('');
      setRundownNotes('');
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
    if (Platform.OS === 'web' && !navigator.onLine) {
      showToast('Fitur ini membutuhkan koneksi internet', 'error');
      return;
    }

    authFetch(`${API_BASE_URL}/api/groups/${groupId}?userId=${user.id}`, { method: 'DELETE' })
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

  const filteredUsersForDropdown = allUsers.filter(u => {
    if (u.id === user?.id) return false;
    if (selectedRole !== 'ALL' && u.id_role?.toString() !== selectedRole) return false;
    return true;
  });

  // Filter Grup Chat Berdasarkan Pencarian
  const filteredGroups = groups.filter(g => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.venue_address && g.venue_address.toLowerCase().includes(q)) ||
      (g.dresscode && g.dresscode.toLowerCase().includes(q))
    );
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
          {item.venue_address ? (
            <View style={styles.venueRow}>
              <Ionicons name="location-outline" size={12} color="#888" />
              <Text style={styles.venueText} numberOfLines={1}>{item.venue_address}</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Obrolan Job ASG</Text>
          <Text style={styles.welcomeText}>Halo, {user?.nama_lengkap || user?.username} ({user?.role_name || 'Member'})</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications" size={24} color="#1A1A1A" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {(user?.id_role === 1 || user?.id_role === 2) && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setIsModalVisible(true)}>
              <Ionicons name="add" size={24} color="#F9F6F0" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SEARCH BAR GRUP CHAT */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={18} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari obrolan job atau lokasi..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL BUAT GRUP BARU DENGAN BRIEFING DETAIL */}
      {isModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Buat Grup Job Baru</Text>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>1. Tanggal Acara / Job:</Text>
              {Platform.OS === 'web' ? (
                // @ts-ignore
                <input
                  type="date"
                  value={groupDate}
                  onChange={(e: any) => setGroupDate(e.target.value)}
                  style={{
                    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0D8C8',
                    fontSize: 14, backgroundColor: '#F9F6F0', marginBottom: 10, width: '100%',
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

              {/* BRIEFING & RUNDOWN INPUTS */}
              <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Call Time:</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Contoh: 14:00"
                    placeholderTextColor="#999"
                    value={callTime}
                    onChangeText={setCallTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Show Time:</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Contoh: 19:30"
                    placeholderTextColor="#999"
                    value={showTime}
                    onChangeText={setShowTime}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Alamat Panggung / Gedung:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Contoh: Ballroom Lt. 2, Hotel Santika"
                placeholderTextColor="#999"
                value={venueAddress}
                onChangeText={setVenueAddress}
              />

              <Text style={styles.inputLabel}>Dresscode Kostum:</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Contoh: Baju Tradisional Jawa Hitam & Emas"
                placeholderTextColor="#999"
                value={dresscode}
                onChangeText={setDresscode}
              />

              <Text style={styles.inputLabel}>Catatan Rundown / Urutan Tampil:</Text>
              <TextInput
                style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Urutan rundown acara..."
                placeholderTextColor="#999"
                multiline
                value={rundownNotes}
                onChangeText={setRundownNotes}
              />

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

      {/* LIST KARTU UNDANGAN JOB PENDING (REAL-TIME) */}
      {invitations.length > 0 && (
        <View style={styles.invitationSection}>
          <Text style={styles.invitationSectionTitle}>💼 Tawaran Job Baru ({invitations.length})</Text>
          {invitations.map((inv) => (
            <View key={inv.invitation_id} style={styles.vipTicketCard}>
              <View style={styles.vipTicketHeader}>
                <Ionicons name="ticket" size={24} color="#D4AF37" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.vipTicketTitle}>{inv.group_name}</Text>
                  <Text style={styles.vipTicketSub}>VIP Invite from: {inv.owner_name || 'Admin'}</Text>
                </View>
                <View style={styles.vipBadge}>
                  <Text style={styles.vipBadgeText}>VIP</Text>
                </View>
              </View>
              
              <View style={styles.ticketDivider}>
                <View style={styles.ticketHoleLeft} />
                <View style={styles.ticketDashedLine} />
                <View style={styles.ticketHoleRight} />
              </View>

              <Text style={styles.vipTicketPrompt}>Kamu menerima akses VIP untuk Job ini. Terima sekarang?</Text>
              
              <View style={styles.vipTicketActions}>
                <Ionicons name="barcode-outline" size={36} color="#1A1A1A" style={{ opacity: 0.6 }} />
                
                <View style={{ flexDirection: 'row', gap: 10 }}>
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
                    <Text style={styles.acceptBtnText}>Terima</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* LIST GRUP AKTIF (REAL-TIME) */}
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
      ) : filteredGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color="#999" />
          <Text style={styles.emptyTitle}>Grup Tidak Ditemukan</Text>
          <Text style={styles.emptySub}>Tidak ada grup obrolan yang cocok dengan "{searchQuery}".</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGroups}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 50,
    paddingBottom: 16,
    backgroundColor: '#F1EBE1',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  welcomeText: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  bellBtn: {
    padding: 8,
    marginRight: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  createBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },

  // Search Bar
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 8 : 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D8C8',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#1A1A1A', paddingVertical: 4 },
  clearSearchBtn: { padding: 4 },

  // Invitations (VIP TICKET DESIGN)
  invitationSection: { padding: 16, backgroundColor: '#1A1A1A', marginTop: 8 },
  invitationSectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#D4AF37', marginBottom: 12, letterSpacing: 1 },
  vipTicketCard: { backgroundColor: '#FDFBF7', borderRadius: 16, marginBottom: 12, elevation: 4, shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, overflow: 'hidden' },
  vipTicketHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#2C2C2C' },
  vipTicketTitle: { fontSize: 16, fontWeight: '900', color: '#D4AF37', textTransform: 'uppercase', letterSpacing: 0.5 },
  vipTicketSub: { fontSize: 11, color: '#A0A0A0', marginTop: 2 },
  vipBadge: { backgroundColor: '#D4AF37', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  vipBadgeText: { color: '#1A1A1A', fontWeight: 'bold', fontSize: 11, letterSpacing: 1 },
  ticketDivider: { flexDirection: 'row', alignItems: 'center', height: 16, backgroundColor: '#2C2C2C' },
  ticketHoleLeft: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1A1A1A', marginLeft: -8 },
  ticketDashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#D4AF37', borderStyle: 'dashed', marginHorizontal: 8, opacity: 0.5 },
  ticketHoleRight: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#1A1A1A', marginRight: -8 },
  vipTicketPrompt: { fontSize: 13, color: '#333', textAlign: 'center', marginVertical: 10, fontWeight: '600', paddingHorizontal: 14 },
  vipTicketActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingTop: 0 },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#FF3B30', backgroundColor: '#FFF' },
  rejectBtnText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 13 },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#D4AF37', elevation: 2 },
  acceptBtnText: { color: '#1A1A1A', fontWeight: 'bold', fontSize: 13 },

  // Groups
  listContainer: { padding: 16 },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
    padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E0D8C8',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  groupInfo: { flex: 1 },
  groupHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  groupName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', flex: 1, marginRight: 8 },
  deleteBtn: { padding: 4 },
  groupSub: { fontSize: 12, color: '#888', marginTop: 2 },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  venueText: { fontSize: 11, color: '#666' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A', marginTop: 14 },
  emptySub: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6 },

  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 450, backgroundColor: '#FFF', borderRadius: 20, padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#444', marginBottom: 4, marginTop: 8 },
  modalInput: { backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 10, padding: 10, fontSize: 13, color: '#1A1A1A' },
  previewBox: { backgroundColor: '#F1EBE1', padding: 10, borderRadius: 10, marginVertical: 6, borderWidth: 1, borderColor: '#E0D8C8' },
  previewLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  previewTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginTop: 2 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 10, backgroundColor: '#F9F6F0', overflow: 'hidden' },
  addToListBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', padding: 10, borderRadius: 10, marginTop: 8 },
  addToListBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  emptyMembersText: { fontSize: 11, color: '#999', fontStyle: 'italic', marginVertical: 4 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1EBE1', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, borderWidth: 1, borderColor: '#E0D8C8' },
  chipText: { fontSize: 11, color: '#1A1A1A', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#F1EBE1' },
  cancelBtnText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  saveBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: '#1A1A1A' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
