import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { API_BASE_URL, authFetch } from '../../config/api';

LocaleConfig.locales['id'] = {
  monthNames: ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'],
  dayNames: ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'],
  dayNamesShort: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'],
  today: 'Hari Ini'
};
LocaleConfig.defaultLocale = 'id';

export default function CalendarScreen() {
  const [user, setUser] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  useFocusEffect(
    useCallback(() => {
      loadUserAndData();
    }, [])
  );

  const loadUserAndData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const u = JSON.parse(userData);
        setUser(u);
        await fetchGroups(u.id);
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
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Hitung jumlah job per tanggal untuk deteksi potensi bentrok
  const dateCounts: Record<string, number> = {};
  groups.forEach(group => {
    if (group.event_date) {
      const d = group.event_date.split('T')[0];
      dateCounts[d] = (dateCounts[d] || 0) + 1;
    }
  });

  // Siapkan penanda tanggal dengan indikator warna cerdas
  const markedDates: any = {};
  groups.forEach(group => {
    if (group.event_date) {
      const d = group.event_date.split('T')[0];
      let dotColor = '#2196F3'; // Biru: Mendatang

      if (dateCounts[d] > 1) {
        dotColor = '#FF5252'; // Merah: Bentrok (>1 Job di hari yang sama)
      } else if (d === todayStr) {
        dotColor = '#D4AF37'; // Emas: Hari Ini
      } else if (d < todayStr) {
        dotColor = '#4CAF50'; // Hijau: Selesai / Lewat
      }

      markedDates[d] = {
        marked: true,
        dotColor,
      };
    }
  });

  if (selectedDate) {
    markedDates[selectedDate] = { 
      ...markedDates[selectedDate], 
      selected: true, 
      selectedColor: '#1A1A1A' 
    };
  }

  const jobsOnSelectedDate = groups.filter(g => g.event_date && g.event_date.split('T')[0] === selectedDate);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#1A1A1A" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jadwal Job</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* LEGENDA WARNA INDIKATOR */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>Status Indikator Kalender:</Text>
          <View style={styles.legendGrid}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#D4AF37' }]} />
              <Text style={styles.legendText}>Hari Ini</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Mendatang</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Selesai</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
              <Text style={styles.legendText}>Bentrok (&gt;1 Job)</Text>
            </View>
          </View>
        </View>

        <View style={styles.calendarWrapper}>
          <Calendar
            current={todayStr}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#FFF',
              calendarBackground: '#FFF',
              textSectionTitleColor: '#1A1A1A',
              selectedDayBackgroundColor: '#1A1A1A',
              selectedDayTextColor: '#FFF',
              todayTextColor: '#D4AF37',
              dayTextColor: '#333',
              textDisabledColor: '#D9D9D9',
              dotColor: '#D4AF37',
              selectedDotColor: '#FFF',
              arrowColor: '#1A1A1A',
              monthTextColor: '#1A1A1A',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600'
            }}
          />
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeaderRow}>
            <Text style={styles.detailsTitle}>
              {selectedDate ? `Agenda untuk ${selectedDate}` : 'Pilih tanggal di kalender'}
            </Text>
            {jobsOnSelectedDate.length > 1 && (
              <View style={styles.conflictBadge}>
                <Ionicons name="warning" size={14} color="#D32F2F" />
                <Text style={styles.conflictText}>Potensi Bentrok ({jobsOnSelectedDate.length} Job)</Text>
              </View>
            )}
          </View>

          {selectedDate && jobsOnSelectedDate.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="calendar-outline" size={36} color="#CCC" />
              <Text style={styles.emptyText}>Tidak ada job di tanggal ini.</Text>
            </View>
          ) : (
            jobsOnSelectedDate.map(job => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() => router.push({ pathname: '/chat/[id]', params: { id: job.id, name: job.name } })}
                activeOpacity={0.7}
              >
                <View style={styles.jobIcon}>
                  <Ionicons name="calendar" size={24} color="#D4AF37" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.jobName}>{job.name}</Text>
                  
                  {/* DETAIL WAKTU & LOKASI */}
                  <View style={styles.jobMetaRow}>
                    {job.call_time ? (
                      <View style={styles.timeTag}>
                        <Ionicons name="alarm-outline" size={12} color="#555" />
                        <Text style={styles.timeTagText}>Call: {job.call_time}</Text>
                      </View>
                    ) : null}
                    {job.show_time ? (
                      <View style={styles.timeTag}>
                        <Ionicons name="musical-notes-outline" size={12} color="#555" />
                        <Text style={styles.timeTagText}>Show: {job.show_time}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.jobSub}>{job.member_count || 0} Anggota</Text>
                  </View>

                  {job.venue_address ? (
                    <View style={styles.venueRow}>
                      <Ionicons name="location-outline" size={13} color="#888" />
                      <Text style={styles.venueText} numberOfLines={1}>{job.venue_address}</Text>
                    </View>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F6F0' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: 20, paddingTop: Platform.OS === 'web' ? 20 : 50, paddingBottom: 20,
    backgroundColor: '#F1EBE1', borderBottomWidth: 1, borderBottomColor: '#E0D8C8',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A' },

  // Legend
  legendCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0D8C8',
  },
  legendTitle: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  legendGrid: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#444', fontWeight: '500' },

  calendarWrapper: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D8C8',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFF'
  },
  detailsContainer: { paddingHorizontal: 16, paddingBottom: 30 },
  detailsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  detailsTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A' },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  conflictText: { fontSize: 11, fontWeight: 'bold', color: '#D32F2F' },

  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#E0D8C8' },
  emptyText: { color: '#888', fontStyle: 'italic', marginTop: 8, fontSize: 13 },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0D8C8',
  },
  jobIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobName: { fontSize: 15, fontWeight: 'bold', color: '#1A1A1A' },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1EBE1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  timeTagText: { fontSize: 11, color: '#444', fontWeight: '500' },
  jobSub: { fontSize: 11, color: '#888' },
  venueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  venueText: { fontSize: 11, color: '#666' },
});
