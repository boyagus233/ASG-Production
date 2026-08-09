import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Dashboard({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard ASG Production</Text>
      <Text style={styles.subtitle}>Selamat datang, Anggota Sanggar!</Text>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => navigation.replace('Login')}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 30 },
  logoutButton: { backgroundColor: '#dc3545', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
