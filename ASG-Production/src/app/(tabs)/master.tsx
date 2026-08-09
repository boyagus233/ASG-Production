import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function MasterScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Master Data</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Kelola Data Sistem</Text>
        <Text style={styles.sectionSubtitle}>Hanya admin yang dapat mengakses halaman ini.</Text>

        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/master/user')}>
            <View style={styles.cardIconBox}>
              <Ionicons name="people" size={32} color="#1A1A1A" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>User Management</Text>
              <Text style={styles.cardDesc}>Tambah, edit, atau hapus anggota sanggar.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push('/master/role')}>
            <View style={styles.cardIconBox}>
              <Ionicons name="shield-checkmark" size={32} color="#1A1A1A" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Role Management</Text>
              <Text style={styles.cardDesc}>Kelola hak akses dan peran (admin/anggota).</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  header: {
    padding: 20, paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#F1EBE1', borderBottomWidth: 1, borderBottomColor: '#E0D8C8'
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },
  scrollContent: { padding: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 30 },
  cardContainer: { gap: 16 },
  card: {
    backgroundColor: '#FFF', borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0D8C8',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2
  },
  cardIconBox: {
    width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1EBE1',
    justifyContent: 'center', alignItems: 'center', marginRight: 16
  },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#666', lineHeight: 20 }
});
