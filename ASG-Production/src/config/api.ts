import { Capacitor } from '@capacitor/core';

export const getApiBaseUrl = (): string => {
  if (typeof window === 'undefined') return 'https://asg.arrareload.com';
  
  const isCapacitorNative = 
    Capacitor.isNativePlatform() ||
    (window as any).Capacitor?.isNativePlatform?.() ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isCapacitorNative) {
    return 'https://asg.arrareload.com';
  }
  
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const getFileUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return `${base}${cleanPath}`;
};

export const getAuthHeaders = async (customHeaders: Record<string, string> = {}): Promise<Record<string, string>> => {
  let token = '';
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    token = (await AsyncStorage.getItem('userToken')) || '';
  } catch (e) {}

  if (!token && typeof window !== 'undefined' && window.localStorage) {
    try {
      token = localStorage.getItem('userToken') || '';
    } catch (e) {}
  }

  const headers: Record<string, string> = { ...customHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const authFetch = async (url: string, options: any = {}): Promise<Response> => {
  let token = '';
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    token = (await AsyncStorage.getItem('userToken')) || '';
  } catch (e) {}

  if (!token && typeof window !== 'undefined' && window.localStorage) {
    try {
      token = localStorage.getItem('userToken') || '';
    } catch (e) {}
  }

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  return fetch(url, {
    ...options,
    headers
  });
};
