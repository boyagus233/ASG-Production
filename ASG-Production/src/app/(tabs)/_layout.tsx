import React, { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          const roleId = Number(user.id_role);
          if (roleId === 1 || roleId === 2) {
            setIsAdmin(true);
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error reading role', error);
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkRole();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F6F0' }}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F1EBE1',
          borderTopColor: '#E0D8C8',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#A0A0A0',
      }}>
      <Tabs.Screen
        name="chats"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Jadwal',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={24} color={color} />,
          href: isAdmin ? '/(tabs)/dashboard' : null,
        }}
      />
      <Tabs.Screen
        name="master"
        options={{
          title: 'Master',
          tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} />,
          href: isAdmin ? '/(tabs)/master' : null, 
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
