import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getFileUrl, API_BASE_URL, authFetch } from '../../config/api';
import { showSystemNotification, syncWebPushToken } from '../../utils/notifications';

export default function SettingsScreen() {
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('userData').then(data => {
        if (data) setUser(JSON.parse(data));
      });
    }, [])
  );

  const handleTestNotification = async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            alert('Izin notifikasi belum diizinkan di browser/HP Anda.');
            return;
          }
        }
        await syncWebPushToken(user?.id);
        await showSystemNotification('🔔 Tes Notifikasi ASG!', {
          body: `Halo ${user?.nama_lengkap || user?.username}! Notifikasi di HP kamu sudah BERHASIL aktif 100%!`,
          icon: '/icon-192.png'
        });
      }

      // Panggil backend juga untuk tes push server
      try {
        await authFetch(`${API_BASE_URL}/api/notifications/send-test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'ASG Production 🔔',
            body: `Halo ${user?.nama_lengkap || user?.username}! Notifikasi push dari server berhasil!`
          })
        });
      } catch (e) {}
    } catch (err: any) {
      alert('Error tes notifikasi: ' + err?.message);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {user?.avatar_url ? (
            <Image
              source={{ uri: getFileUrl(user.avatar_url) }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>{user?.username?.charAt(0).toUpperCase() || 'U'}</Text>
          )}
        </View>
        <Text style={styles.name}>{user?.nama_lengkap || user?.username || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'email@example.com'}</Text>
        {user?.no_hp ? (
          <View style={styles.phoneRow}>
            <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
            <Text style={styles.phoneText}>{user.no_hp}</Text>
          </View>
        ) : null}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user?.id_role === 1 ? 'Administrator' : 'Anggota'}</Text>
        </View>
      </View>

      <View style={styles.menuContainer}>
        {/* Edit Profil */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="person-outline" size={24} color="#1A1A1A" style={styles.menuIcon} />
          <Text style={styles.menuText}>Edit Profil</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Notifikasi */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#1A1A1A" style={styles.menuIcon} />
          <Text style={styles.menuText}>Riwayat Notifikasi</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>

        {/* Tes Bunyikan Notifikasi HP */}
        <TouchableOpacity style={[styles.menuItem, { backgroundColor: '#F5EFE0', borderRadius: 12, paddingHorizontal: 12, marginVertical: 4 }]} onPress={handleTestNotification}>
          <Ionicons name="volume-high-outline" size={24} color="#D4AF37" style={styles.menuIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuText, { fontWeight: 'bold', color: '#1A1A1A' }]}>Tes Bunyikan Notifikasi HP</Text>
            <Text style={{ fontSize: 11, color: '#666' }}>Uji coba banner & suara notifikasi sekarang</Text>
          </View>
          <Ionicons name="play-circle" size={24} color="#D4AF37" />
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: '#FF3B30' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: {
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#F1EBE1',
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8'
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0D8C8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#1A1A1A' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  phoneText: { fontSize: 13, color: '#25D366', fontWeight: '600' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 6 },
  badge: {
    backgroundColor: '#F1EBE1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D8C8'
  },
  badgeText: { color: '#1A1A1A', fontSize: 12, fontWeight: 'bold' },
  menuContainer: { padding: 20 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8'
  },
  menuItemDisabled: { opacity: 0.7 },
  menuIcon: { marginRight: 16 },
  menuText: { flex: 1, fontSize: 16, color: '#1A1A1A' },
  // Progress bar
  progressBarTrack: {
    height: 4,
    backgroundColor: '#E0D8C8',
    borderRadius: 2,
    overflow: 'hidden',
    width: '80%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
});