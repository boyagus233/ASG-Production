import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_BASE_URL, authFetch } from '../config/api';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          await fetchNotifications(parsedUser.id);
          await markAllAsRead(parsedUser.id);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/api/notifications?userId=${userId}&raw=true`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : (data.data || []));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAllAsRead = async (userId: string) => {
    try {
      await authFetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={[styles.card, !item.is_read && styles.unreadCard]}>
        <View style={styles.cardHeader}>
          <Ionicons name="notifications" size={20} color={!item.is_read ? "#D4AF37" : "#888"} />
          <Text style={[styles.title, !item.is_read && styles.unreadText]}>{item.title}</Text>
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pusat Notifikasi</Text>
        <View style={{ width: 24 }} /> {/* Placeholder for balance */}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A1A1A" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>Belum ada notifikasi.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F6F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1EBE1',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadCard: {
    backgroundColor: '#FDFBF7',
    borderColor: '#D4AF37',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  body: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
});
