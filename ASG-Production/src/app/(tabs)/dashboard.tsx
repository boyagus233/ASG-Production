import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Platform, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL, authFetch } from '../../config/api';
import { socket } from '../../services/socket';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'audit' | 'notifs'>('audit');

  // Key Stats
  const [stats, setStats] = useState({
    activeJobsCount: 0,
    completedJobsCount: 0,
    totalMembersCount: 0,
  });

  // Audit Logs & Pagination State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  // Notifications & Pagination State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifPage, setNotifPage] = useState(1);
  const [notifLimit, setNotifLimit] = useState(10);
  const [notifTotalCount, setNotifTotalCount] = useState(0);
  const [notifTotalPages, setNotifTotalPages] = useState(1);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifSearch, setNotifSearch] = useState('');
  const [notifFilter, setNotifFilter] = useState('ALL'); // ALL, UNREAD, READ

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  // 1. Initial Load: User & Stats
  useEffect(() => {
    const initUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const u = JSON.parse(userData);
          setUser(u);
          fetchStats();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    initUser();

    // Socket.io event listeners
    socket.on('update_dashboard', () => {
      fetchStats();
      fetchAuditLogs(page, limit, searchQuery, actionFilter);
    });

    socket.on('update_notifications', () => {
      if (user?.id) fetchNotifications(user.id, notifPage, notifLimit, notifSearch, notifFilter);
    });

    return () => {
      socket.off('update_dashboard');
      socket.off('update_notifications');
    };
  }, []);

  // 2. Controlled Fetch for Audit Logs whenever page, limit, or actionFilter changes
  useEffect(() => {
    fetchAuditLogs(page, limit, searchQuery, actionFilter);
  }, [page, limit, actionFilter]);

  // 3. Controlled Fetch for Notifications whenever user, notifPage, notifLimit, or notifFilter changes
  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id, notifPage, notifLimit, notifSearch, notifFilter);
    }
  }, [user?.id, notifPage, notifLimit, notifFilter]);

  const fetchStats = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/groups/dashboard-stats`);
      const data = await res.json();
      setStats(data);
      AsyncStorage.setItem('cache_dashboard_stats', JSON.stringify(data));
    } catch (error) {
      const cached = await AsyncStorage.getItem('cache_dashboard_stats');
      if (cached) setStats(JSON.parse(cached));
    }
  };

  // --- AUDIT LOGS FETCH & PAGINATION ---
  const fetchAuditLogs = async (pageNum: number, pageSize: number, search: string, action: string) => {
    setLoadingLogs(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: pageSize.toString(),
        search: search,
        action: action
      });

      const res = await authFetch(`${API_BASE_URL}/api/groups/audit-logs?${queryParams.toString()}`);
      const data = await res.json();
      
      setAuditLogs(data.data || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 1);
      
      AsyncStorage.setItem('cache_dashboard_audit_logs', JSON.stringify(data.data || []));
    } catch (error) {
      const cached = await AsyncStorage.getItem('cache_dashboard_audit_logs');
      if (cached) setAuditLogs(JSON.parse(cached));
      else showToast('Gagal memuat log aktivitas', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSearchSubmit = () => {
    setPage(1);
    fetchAuditLogs(1, limit, searchQuery, actionFilter);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    fetchAuditLogs(1, limit, '', actionFilter);
  };

  const handleActionFilterChange = (newAction: string) => {
    setActionFilter(newAction);
    setPage(1);
    fetchAuditLogs(1, limit, searchQuery, newAction);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchAuditLogs(newPage, limit, searchQuery, actionFilter);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchAuditLogs(1, newLimit, searchQuery, actionFilter);
  };

  // --- NOTIFICATIONS FETCH & PAGINATION ---
  const fetchNotifications = async (userId: string, pageNum: number, pageSize: number, search: string, filter: string) => {
    setLoadingNotifs(true);
    try {
      const queryParams = new URLSearchParams({
        userId,
        page: pageNum.toString(),
        limit: pageSize.toString(),
        search: search,
        filter: filter
      });

      const res = await authFetch(`${API_BASE_URL}/api/notifications?${queryParams.toString()}`);
      const data = await res.json();

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setNotifications(data.data || []);
        setNotifTotalCount(data.totalCount || 0);
        setNotifTotalPages(data.totalPages || 1);
        setNotifUnreadCount(data.unreadCount || 0);
        AsyncStorage.setItem(`cache_dashboard_notifs_${userId}`, JSON.stringify(data.data || []));
      } else if (Array.isArray(data)) {
        setNotifications(data);
        setNotifTotalCount(data.length);
        setNotifTotalPages(1);
        setNotifUnreadCount(data.filter((n: any) => !n.is_read).length);
      }
    } catch (error) {
      const cached = await AsyncStorage.getItem(`cache_dashboard_notifs_${userId}`);
      if (cached) setNotifications(JSON.parse(cached));
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotifSearchSubmit = () => {
    setNotifPage(1);
    if (user?.id) fetchNotifications(user.id, 1, notifLimit, notifSearch, notifFilter);
  };

  const handleClearNotifSearch = () => {
    setNotifSearch('');
    setNotifPage(1);
    if (user?.id) fetchNotifications(user.id, 1, notifLimit, '', notifFilter);
  };

  const handleNotifFilterChange = (newFilter: string) => {
    setNotifFilter(newFilter);
    setNotifPage(1);
    if (user?.id) fetchNotifications(user.id, 1, notifLimit, notifSearch, newFilter);
  };

  const handleNotifPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > notifTotalPages || newPage === notifPage) return;
    setNotifPage(newPage);
    if (user?.id) fetchNotifications(user.id, newPage, notifLimit, notifSearch, notifFilter);
  };

  const handleNotifLimitChange = (newLimit: number) => {
    setNotifLimit(newLimit);
    setNotifPage(1);
    if (user?.id) fetchNotifications(user.id, 1, newLimit, notifSearch, notifFilter);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    try {
      showToast('Tandai semua dibaca...', 'info');
      await authFetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      showToast('Semua notifikasi telah ditandai dibaca', 'success');
      fetchNotifications(user.id, notifPage, notifLimit, notifSearch, notifFilter);
    } catch {
      showToast('Gagal menandai notifikasi', 'error');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await fetchAuditLogs(page, limit, searchQuery, actionFilter);
    if (user?.id) await fetchNotifications(user.id, notifPage, notifLimit, notifSearch, notifFilter);
    setRefreshing(false);
  };

  const handleExportLaporan = async () => {
    try {
      if (Platform.OS === 'web') {
        window.open(`${API_BASE_URL}/api/groups/export-report`, '_blank');
      } else {
        const downloadRes = await FileSystem.downloadAsync(
          `${API_BASE_URL}/api/groups/export-report`,
          FileSystem.documentDirectory + 'Laporan_Job_ASG.xlsx'
        );
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri);
        } else {
          Alert.alert('Berhasil', 'File berhasil diunduh ke direktori dokumen.');
        }
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal mengunduh laporan');
    }
  };

  const completionRate = (stats.activeJobsCount + stats.completedJobsCount) === 0
    ? 0
    : Math.round((stats.completedJobsCount / (stats.activeJobsCount + stats.completedJobsCount)) * 100);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  // Calculate audit log range info
  const startItem = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalCount);

  // Calculate notif range info
  const startNotifItem = notifTotalCount === 0 ? 0 : (notifPage - 1) * notifLimit + 1;
  const endNotifItem = Math.min(notifPage * notifLimit, notifTotalCount);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#1A1A1A" />}
    >
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* TOP BANNER & HEADER */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.liveTagRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTagText}>LIVE MONITORING SYSTEM</Text>
          </View>
          <Text style={styles.headerTitle}>Dashboard Admin 📊</Text>
          <Text style={styles.headerSubtitle}>Manajemen Job Acara, Statistik & Log Aktivitas</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.exportBtn} onPress={handleExportLaporan} activeOpacity={0.8}>
            <Ionicons name="document-text-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.exportText}>Export Excel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* METRICS DASHBOARD CARDS */}
      <View style={styles.statsGrid}>
        {/* Card 1: Job Berjalan */}
        <View style={[styles.statCard, { borderTopColor: '#2196F3' }]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="briefcase" size={22} color="#2196F3" />
            </View>
            <Text style={[styles.statBadge, { color: '#1E88E5', backgroundColor: '#E3F2FD' }]}>BERJALAN</Text>
          </View>
          <Text style={styles.statNumber}>{stats.activeJobsCount}</Text>
          <Text style={styles.statLabel}>Job / Grup Aktif</Text>
        </View>

        {/* Card 2: Job Selesai */}
        <View style={[styles.statCard, { borderTopColor: '#2E7D32' }]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconCircle, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="checkmark-done-circle" size={22} color="#2E7D32" />
            </View>
            <Text style={[styles.statBadge, { color: '#2E7D32', backgroundColor: '#E8F5E9' }]}>SELESAI</Text>
          </View>
          <Text style={styles.statNumber}>{stats.completedJobsCount}</Text>
          <Text style={styles.statLabel}>Riwayat Job Selesai</Text>
        </View>

        {/* Card 3: Personil Terdaftar */}
        <View style={[styles.statCard, { borderTopColor: '#F57C00' }]}>
          <View style={styles.statHeader}>
            <View style={[styles.statIconCircle, { backgroundColor: '#FFF3E0' }]}>
              <Ionicons name="people" size={22} color="#F57C00" />
            </View>
            <Text style={[styles.statBadge, { color: '#F57C00', backgroundColor: '#FFF3E0' }]}>PERSONIL</Text>
          </View>
          <Text style={styles.statNumber}>{stats.totalMembersCount}</Text>
          <Text style={styles.statLabel}>Total Personil ASG</Text>
        </View>
      </View>

      {/* RATIO & PERFORMANCE WIDGET */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="analytics" size={20} color="#D4AF37" style={{ marginRight: 8 }} />
            <Text style={styles.progressTitle}>Tingkat Penyelesaian Job</Text>
          </View>
          <Text style={styles.progressPercentage}>{completionRate}%</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
        </View>

        <View style={styles.progressLabels}>
          <Text style={styles.progressLabelText}>🔵 Job Berjalan: <Text style={{ fontWeight: 'bold' }}>{stats.activeJobsCount}</Text></Text>
          <Text style={styles.progressLabelText}>🟢 Job Selesai: <Text style={{ fontWeight: 'bold' }}>{stats.completedJobsCount}</Text></Text>
        </View>
      </View>

      {/* DASHBOARD TABS (Audit Log / Notifications) */}
      <View style={styles.tabNavContainer}>
        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'audit' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('audit')}
        >
          <Ionicons name="receipt-outline" size={18} color={activeTab === 'audit' ? '#FFF' : '#666'} />
          <Text style={[styles.tabNavText, activeTab === 'audit' && styles.tabNavTextActive]}>Riwayat Aktivitas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavBtn, activeTab === 'notifs' && styles.tabNavBtnActive]}
          onPress={() => setActiveTab('notifs')}
        >
          <Ionicons name="notifications-outline" size={18} color={activeTab === 'notifs' ? '#FFF' : '#666'} />
          <Text style={[styles.tabNavText, activeTab === 'notifs' && styles.tabNavTextActive]}>Notifikasi System</Text>
          {notifUnreadCount > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{notifUnreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* TAB CONTENT 1: AUDIT LOGS WITH FULL PAGINATION & FILTERS */}
      {activeTab === 'audit' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📋 Log Aktivitas & Respon Personil</Text>
            <Text style={styles.recordCountText}>Total: {totalCount} Data</Text>
          </View>

          {/* SEARCH & FILTER CONTROLS */}
          <View style={styles.filterBarContainer}>
            {/* Search Input Box */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari nama personil atau aktivitas..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchSubmit}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClearSearch} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Action Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'CREATE_GROUP', label: '➕ Buat Job' },
                { id: 'DELETE_GROUP', label: '📦 Selesaikan Job' },
                { id: 'ACCEPT_JOB', label: '✅ Terima Job' },
                { id: 'REJECT_JOB', label: '❌ Tolak Job' }
              ].map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, actionFilter === f.id && styles.filterPillActive]}
                  onPress={() => handleActionFilterChange(f.id)}
                >
                  <Text style={[styles.filterPillText, actionFilter === f.id && styles.filterPillTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* AUDIT LOG LIST */}
          {loadingLogs ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1A1A1A" />
              <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>Memuat data log...</Text>
            </View>
          ) : auditLogs.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={40} color="#CCC" />
              <Text style={styles.emptyTitle}>Data Tidak Ditemukan</Text>
              <Text style={styles.emptySub}>Tidak ada riwayat aktivitas yang cocok dengan pencarian / filter Anda.</Text>
            </View>
          ) : (
            <View style={styles.logList}>
              {auditLogs.map((item) => {
                let icon = "information-circle";
                let color = "#1A1A1A";
                let badgeLabel = "INFO";

                if (item.action === 'CREATE_GROUP') { icon = 'add-circle'; color = '#2196F3'; badgeLabel = "BUAT JOB"; }
                else if (item.action === 'DELETE_GROUP') { icon = 'archive'; color = '#E65100'; badgeLabel = "SELESAI JOB"; }
                else if (item.action === 'ACCEPT_JOB') { icon = 'checkmark-circle'; color = '#2E7D32'; badgeLabel = "TERIMA JOB"; }
                else if (item.action === 'REJECT_JOB') { icon = 'close-circle'; color = '#C62828'; badgeLabel = "TOLAK JOB"; }

                return (
                  <View key={item.id} style={styles.logCard}>
                    <View style={[styles.logIconCircle, { backgroundColor: color + '15' }]}>
                      <Ionicons name={icon as any} size={22} color={color} />
                    </View>

                    <View style={styles.logBody}>
                      <View style={styles.logTitleRow}>
                        <Text style={styles.logActionText}>{item.details}</Text>
                        <View style={[styles.actionBadge, { backgroundColor: color + '15' }]}>
                          <Text style={[styles.actionBadgeText, { color }]}>{badgeLabel}</Text>
                        </View>
                      </View>

                      <View style={styles.logMetaRow}>
                        <Ionicons name="person-outline" size={12} color="#888" style={{ marginRight: 4 }} />
                        <Text style={styles.logUserText}>{item.nama_lengkap || item.username || 'System'}</Text>
                        <Text style={styles.logDotDivider}>•</Text>
                        <Ionicons name="time-outline" size={12} color="#888" style={{ marginRight: 4 }} />
                        <Text style={styles.logTimeText}>
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {' '}
                          {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* PAGINATION CONTROLS FOR AUDIT LOGS */}
          {totalPages > 0 && (
            <View style={styles.paginationWrapper}>
              <View style={styles.paginationInfoRow}>
                <Text style={styles.paginationSummaryText}>
                  Menampilkan <Text style={{ fontWeight: 'bold' }}>{startItem}-{endItem}</Text> dari <Text style={{ fontWeight: 'bold' }}>{totalCount}</Text> data
                </Text>

                {/* Per Page Limit Select */}
                <View style={styles.limitSelectorRow}>
                  <Text style={styles.limitLabel}>Tampilkan:</Text>
                  {[5, 10, 20].map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.limitPill, limit === l && styles.limitPillActive]}
                      onPress={() => handleLimitChange(l)}
                    >
                      <Text style={[styles.limitPillText, limit === l && styles.limitPillTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Navigation Page Buttons */}
              <View style={styles.paginationNavRow}>
                <TouchableOpacity
                  style={[styles.pageNavBtn, page === 1 && styles.pageNavBtnDisabled]}
                  onPress={() => handlePageChange(1)}
                  disabled={page === 1}
                >
                  <Ionicons name="play-skip-back-outline" size={16} color={page === 1 ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pageNavBtn, page === 1 && styles.pageNavBtnDisabled]}
                  onPress={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                >
                  <Ionicons name="chevron-back-outline" size={16} color={page === 1 ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>

                {/* Numeric Page Buttons */}
                <View style={styles.pageNumbersRow}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <Text style={styles.ellipsisText}>...</Text>}
                          <TouchableOpacity
                            style={[styles.pageNumberBtn, page === p && styles.pageNumberBtnActive]}
                            onPress={() => handlePageChange(p)}
                          >
                            <Text style={[styles.pageNumberText, page === p && styles.pageNumberTextActive]}>{p}</Text>
                          </TouchableOpacity>
                        </React.Fragment>
                      );
                    })}
                </View>

                <TouchableOpacity
                  style={[styles.pageNavBtn, page === totalPages && styles.pageNavBtnDisabled]}
                  onPress={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                >
                  <Ionicons name="chevron-forward-outline" size={16} color={page === totalPages ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pageNavBtn, page === totalPages && styles.pageNavBtnDisabled]}
                  onPress={() => handlePageChange(totalPages)}
                  disabled={page === totalPages}
                >
                  <Ionicons name="play-skip-forward-outline" size={16} color={page === totalPages ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* TAB CONTENT 2: NOTIFICATIONS FEED WITH FULL PAGINATION & SEARCH */}
      {activeTab === 'notifs' && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>🔔 Notifikasi Sistem</Text>
              <Text style={styles.recordCountText}>Total: {notifTotalCount} Notifikasi ({notifUnreadCount} Belum Dibaca)</Text>
            </View>

            {notifUnreadCount > 0 && (
              <TouchableOpacity style={styles.markReadBtn} onPress={handleMarkAllRead}>
                <Ionicons name="checkmark-done-outline" size={16} color="#1A1A1A" style={{ marginRight: 4 }} />
                <Text style={styles.markReadText}>Tandai Dibaca</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* SEARCH & FILTER BAR FOR NOTIFICATIONS */}
          <View style={styles.filterBarContainer}>
            {/* Search Box */}
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Cari judul atau isi notifikasi..."
                placeholderTextColor="#999"
                value={notifSearch}
                onChangeText={setNotifSearch}
                onSubmitEditing={handleNotifSearchSubmit}
              />
              {notifSearch.length > 0 && (
                <TouchableOpacity onPress={handleClearNotifSearch} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills: All / Unread / Read */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPillsScroll}>
              {[
                { id: 'ALL', label: 'Semua Notifikasi' },
                { id: 'UNREAD', label: '🔴 Belum Dibaca' },
                { id: 'READ', label: '🟢 Sudah Dibaca' }
              ].map(f => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.filterPill, notifFilter === f.id && styles.filterPillActive]}
                  onPress={() => handleNotifFilterChange(f.id)}
                >
                  <Text style={[styles.filterPillText, notifFilter === f.id && styles.filterPillTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* NOTIFICATION LIST */}
          {loadingNotifs ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1A1A1A" />
              <Text style={{ marginTop: 10, color: '#888', fontSize: 13 }}>Memuat notifikasi...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="notifications-off-outline" size={40} color="#CCC" />
              <Text style={styles.emptyTitle}>Belum Ada Notifikasi</Text>
              <Text style={styles.emptySub}>Tidak ada notifikasi yang cocok dengan kata kunci / filter Anda.</Text>
            </View>
          ) : (
            notifications.map((item) => (
              <View key={item.id} style={[styles.notifCard, !item.is_read && styles.notifCardUnread]}>
                <View style={[styles.notifIconCircle, !item.is_read && { backgroundColor: '#FFF8E1' }]}>
                  <Ionicons name={item.is_read ? "notifications-outline" : "notifications"} size={20} color={item.is_read ? "#888" : "#D4AF37"} />
                </View>
                <View style={styles.notifBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.notifTitle}>{item.title}</Text>
                    {!item.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage}>{item.body}</Text>
                  <Text style={styles.notifTime}>
                    {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} {' '}
                    {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* PAGINATION CONTROLS FOR NOTIFICATIONS */}
          {notifTotalPages > 0 && (
            <View style={styles.paginationWrapper}>
              <View style={styles.paginationInfoRow}>
                <Text style={styles.paginationSummaryText}>
                  Menampilkan <Text style={{ fontWeight: 'bold' }}>{startNotifItem}-{endNotifItem}</Text> dari <Text style={{ fontWeight: 'bold' }}>{notifTotalCount}</Text> notifikasi
                </Text>

                {/* Per Page Limit Select */}
                <View style={styles.limitSelectorRow}>
                  <Text style={styles.limitLabel}>Tampilkan:</Text>
                  {[5, 10, 20].map(l => (
                    <TouchableOpacity
                      key={l}
                      style={[styles.limitPill, notifLimit === l && styles.limitPillActive]}
                      onPress={() => handleNotifLimitChange(l)}
                    >
                      <Text style={[styles.limitPillText, notifLimit === l && styles.limitPillTextActive]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Navigation Page Buttons */}
              <View style={styles.paginationNavRow}>
                <TouchableOpacity
                  style={[styles.pageNavBtn, notifPage === 1 && styles.pageNavBtnDisabled]}
                  onPress={() => handleNotifPageChange(1)}
                  disabled={notifPage === 1}
                >
                  <Ionicons name="play-skip-back-outline" size={16} color={notifPage === 1 ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pageNavBtn, notifPage === 1 && styles.pageNavBtnDisabled]}
                  onPress={() => handleNotifPageChange(notifPage - 1)}
                  disabled={notifPage === 1}
                >
                  <Ionicons name="chevron-back-outline" size={16} color={notifPage === 1 ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>

                {/* Numeric Page Buttons */}
                <View style={styles.pageNumbersRow}>
                  {Array.from({ length: notifTotalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === notifTotalPages || Math.abs(p - notifPage) <= 1)
                    .map((p, idx, arr) => {
                      const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <Text style={styles.ellipsisText}>...</Text>}
                          <TouchableOpacity
                            style={[styles.pageNumberBtn, notifPage === p && styles.pageNumberBtnActive]}
                            onPress={() => handleNotifPageChange(p)}
                          >
                            <Text style={[styles.pageNumberText, notifPage === p && styles.pageNumberTextActive]}>{p}</Text>
                          </TouchableOpacity>
                        </React.Fragment>
                      );
                    })}
                </View>

                <TouchableOpacity
                  style={[styles.pageNavBtn, notifPage === notifTotalPages && styles.pageNavBtnDisabled]}
                  onPress={() => handleNotifPageChange(notifPage + 1)}
                  disabled={notifPage === notifTotalPages}
                >
                  <Ionicons name="chevron-forward-outline" size={16} color={notifPage === notifTotalPages ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pageNavBtn, notifPage === notifTotalPages && styles.pageNavBtnDisabled]}
                  onPress={() => handleNotifPageChange(notifTotalPages)}
                  disabled={notifPage === notifTotalPages}
                >
                  <Ionicons name="play-skip-forward-outline" size={16} color={notifPage === notifTotalPages ? '#CCC' : '#1A1A1A'} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  contentContainer: { padding: 20, paddingTop: Platform.OS === 'web' ? 20 : 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F6F0' },

  // Header Banner
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  liveTagRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2E7D32', marginRight: 6 },
  liveTagText: { fontSize: 10, fontWeight: '800', color: '#2E7D32', letterSpacing: 1 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refreshBtn: { padding: 10, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0D8C8' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, elevation: 2 },
  exportText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, minWidth: 140, backgroundColor: '#FFF', padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#E0D8C8', borderTopWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statIconCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statBadge: { fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  statNumber: { fontSize: 28, fontWeight: '900', color: '#1A1A1A', marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600' },

  // Progress Bar
  progressContainer: { backgroundColor: '#FFF', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#E0D8C8', marginBottom: 24 },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  progressPercentage: { fontSize: 16, fontWeight: '900', color: '#2E7D32' },
  progressBarBg: { height: 10, backgroundColor: '#F1EBE1', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2E7D32', borderRadius: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  progressLabelText: { fontSize: 12, color: '#666' },

  // Tab Nav
  tabNavContainer: { flexDirection: 'row', backgroundColor: '#EFEBE4', padding: 4, borderRadius: 14, marginBottom: 20 },
  tabNavBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  tabNavBtnActive: { backgroundColor: '#1A1A1A' },
  tabNavText: { fontSize: 13, fontWeight: '600', color: '#666', marginLeft: 6 },
  tabNavTextActive: { color: '#FFF', fontWeight: 'bold' },
  tabBadge: { backgroundColor: '#FF3B30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 6 },
  tabBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  // Section Card
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E0D8C8', marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  recordCountText: { fontSize: 12, color: '#888', fontWeight: '600', marginTop: 2 },
  markReadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1EBE1', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  markReadText: { fontSize: 12, fontWeight: 'bold', color: '#1A1A1A' },

  // Filter Bar
  filterBarContainer: { marginBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F6F0', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, color: '#1A1A1A' },

  filterPillsScroll: { flexDirection: 'row', paddingVertical: 4 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1EBE1', marginRight: 8, borderWidth: 1, borderColor: '#E0D8C8' },
  filterPillActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  filterPillText: { fontSize: 12, color: '#666', fontWeight: '600' },
  filterPillTextActive: { color: '#FFF', fontWeight: 'bold' },

  // Log List
  logList: { gap: 10 },
  logCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FDFBF7', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#F1EBE1' },
  logIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logBody: { flex: 1 },
  logTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  logActionText: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', flex: 1, marginRight: 8 },
  actionBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  actionBadgeText: { fontSize: 9, fontWeight: '800' },
  logMetaRow: { flexDirection: 'row', alignItems: 'center' },
  logUserText: { fontSize: 12, color: '#555', fontWeight: '600' },
  logDotDivider: { marginHorizontal: 6, color: '#CCC' },
  logTimeText: { fontSize: 11, color: '#999' },

  // Empty Box
  emptyBox: { padding: 32, alignItems: 'center', backgroundColor: '#F9F6F0', borderRadius: 16, borderWidth: 1, borderColor: '#E0D8C8' },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4 },

  // Pagination Controls UI
  paginationWrapper: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1EBE1' },
  paginationInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  paginationSummaryText: { fontSize: 12, color: '#666' },

  limitSelectorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  limitLabel: { fontSize: 12, color: '#666', marginRight: 4 },
  limitPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1EBE1' },
  limitPillActive: { backgroundColor: '#1A1A1A' },
  limitPillText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  limitPillTextActive: { color: '#FFF' },

  paginationNavRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  pageNavBtn: { width: 34, height: 34, borderRadius: 8, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0D8C8' },
  pageNavBtnDisabled: { opacity: 0.4 },

  pageNumbersRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pageNumberBtn: { minWidth: 34, height: 34, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E0D8C8' },
  pageNumberBtnActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  pageNumberText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  pageNumberTextActive: { color: '#FFF' },
  ellipsisText: { fontSize: 14, color: '#888', marginHorizontal: 2 },

  // Notifications
  notifCard: { flexDirection: 'row', backgroundColor: '#FDFBF7', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E0D8C8' },
  notifCardUnread: { backgroundColor: '#FFFDF0', borderColor: '#F57C00' },
  notifIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifBody: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  notifMessage: { fontSize: 13, color: '#444', marginTop: 2 },
  notifTime: { fontSize: 11, color: '#999', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' },
});
