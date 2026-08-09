import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL } from '../../config/api';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [stats, setStats] = useState({
    activeJobsCount: 0,
    completedJobsCount: 0,
    totalMembersCount: 0,
    history: [] as any[],
  });

  const [notifications, setNotifications] = useState<any[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);
        await Promise.all([fetchStats(), fetchNotifications(u.id)]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/groups/dashboard-stats`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      showToast('Gagal memuat statistik dashboard', 'error');
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (error) {
      // silent
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1A1A1A" />}
    >
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard Pekerjaan 💼</Text>
          <Text style={styles.headerSubtitle}>Ringkasan Job Acara & Riwayat Selesai</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
          <Ionicons name="refresh" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* STAT CARDS */}
      <View style={styles.statsGrid}>
        {/* Card 1: Job Aktif */}
        <View style={[styles.statCard, { borderLeftColor: '#2196F3' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="briefcase" size={24} color="#2196F3" />
            <Text style={styles.statBadge}>BERJALAN</Text>
          </View>
          <Text style={styles.statNumber}>{stats.activeJobsCount}</Text>
          <Text style={styles.statLabel}>Job / Grup Aktif</Text>
        </View>

        {/* Card 2: Job Selesai */}
        <View style={[styles.statCard, { borderLeftColor: '#4CAF50' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statBadge, { color: '#4CAF50', backgroundColor: '#E8F5E9' }]}>SELESAI</Text>
          </View>
          <Text style={styles.statNumber}>{stats.completedJobsCount}</Text>
          <Text style={styles.statLabel}>Riwayat Job Selesai</Text>
        </View>

        {/* Card 3: Total Member */}
        <View style={[styles.statCard, { borderLeftColor: '#FF9800' }]}>
          <View style={styles.statHeader}>
            <Ionicons name="people" size={24} color="#FF9800" />
            <Text style={[styles.statBadge, { color: '#FF9800', backgroundColor: '#FFF3E0' }]}>ANGGOTA</Text>
          </View>
          <Text style={styles.statNumber}>{stats.totalMembersCount}</Text>
          <Text style={styles.statLabel}>Total Personil Terdaftar</Text>
        </View>
      </View>

      {/* NOTIFIKASI TERKINI SECTION */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications" size={20} color="#1A1A1A" />
          <Text style={styles.sectionTitle}>Notifikasi & Status Respon Member</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Belum ada notifikasi baru.</Text>
          </View>
        ) : (
          notifications.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.notifCard}>
              <View style={styles.notifIconCircle}>
                <Ionicons name="information-circle" size={20} color="#1A1A1A" />
              </View>
              <View style={styles.notifBody}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifMessage}>{item.body}</Text>
                <Text style={styles.notifTime}>{new Date(item.created_at).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* RIWAYAT JOB SELESAI TABLE */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={20} color="#1A1A1A" />
          <Text style={styles.sectionTitle}>Riwayat Job Yang Sudah Dibubarkan</Text>
        </View>

        {stats.history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="archive-outline" size={32} color="#BBB" />
            <Text style={styles.emptyText}>Belum ada grup/job yang selesai dibubarkan.</Text>
          </View>
        ) : (
          stats.history.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View style={styles.historyIconBg}>
                <Ionicons name="folder-open" size={22} color="#1A1A1A" />
              </View>
              <View style={styles.historyBody}>
                <Text style={styles.historyName}>{item.name}</Text>
                <Text style={styles.historyMeta}>
                  Pembuat: {item.owner_name || 'Admin'} • {item.member_count} Anggota
                </Text>
                <Text style={styles.historyDate}>
                  Selesai pada: {new Date(item.completed_at).toLocaleDateString()} {new Date(item.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>SELESAI</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  contentContainer: { padding: 20, paddingTop: Platform.OS === 'web' ? 20 : 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F6F0' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  refreshBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0D8C8' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, minWidth: 150, backgroundColor: '#FFF', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#E0D8C8', borderLeftWidth: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statBadge: { fontSize: 10, fontWeight: 'bold', color: '#2196F3', backgroundColor: '#E3F2FD', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statNumber: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '500' },

  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },

  emptyBox: { padding: 24, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E0D8C8' },
  emptyText: { marginTop: 8, fontSize: 13, color: '#888' },

  notifCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E0D8C8' },
  notifIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  notifMessage: { fontSize: 13, color: '#444', marginTop: 2 },
  notifTime: { fontSize: 10, color: '#999', marginTop: 4 },

  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E0D8C8' },
  historyIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyBody: { flex: 1 },
  historyName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  historyMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  historyDate: { fontSize: 11, color: '#999', marginTop: 2 },
  statusPill: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 11, fontWeight: 'bold', color: '#4CAF50' },
});
