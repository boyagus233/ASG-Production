import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Linking, ScrollView, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL as BASE_URL } from '../../config/api';
import { socket } from '../../services/socket';
import { Capacitor } from '@capacitor/core';
import { Image as ExpoImage } from 'expo-image';

// ─── KOMPONEN GAMBAR REMOTE UNTUK MENGATASI BLOKIR WEBVIEW ───
const RemoteImage = ({ uri, style }: { uri: string, style: any }) => {
  const [blobUri, setBlobUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(uri)
      .then(res => res.blob())
      .then(blob => {
        if (active) {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUri(objectUrl);
        }
      })
      .catch(err => console.error('Gagal fetch gambar:', err));
    return () => { active = false; };
  }, [uri]);

  if (!blobUri) {
    return <View style={[style, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color="#fff" />
    </View>;
  }
  return <ExpoImage source={{ uri: blobUri }} style={style} contentFit="cover" />;
};

export default function ChatRoom() {
  const { id, name } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // Playback state
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Location
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Info Modal
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Attachment menu
  const [isAttachMenuVisible, setIsAttachMenuVisible] = useState(false);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    loadData();

    // ⚡ REAL-TIME SOCKET.IO LISTENERS FOR CHAT
    socket.emit('join_group', id);

    socket.on('receive_message', (newMsg: any) => {
      setMessages((prev) => {
        // Prevent duplicate messages if added locally
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('group_deleted', (data: any) => {
      if (data.groupId.toString() === id?.toString()) {
        showToast('Grup ini telah dibubarkan oleh Admin.', 'info');
        setTimeout(() => router.replace('/(tabs)/chats'), 1500);
      }
    });

    return () => {
      socket.emit('leave_group', id);
      socket.off('receive_message');
      socket.off('group_deleted');
      if (audioRef.current) {
        audioRef.current.unloadAsync();
        audioRef.current = null;
      }
    };
  }, [id]);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.4, duration: 500, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  const loadData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) setUser(JSON.parse(userData));
      await fetchMessages();
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/messages/${id}`);
      const data = await res.json();
      setMessages(data);
    } catch {}
    finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const fetchGroupMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${id}/members`);
      setGroupMembers(await res.json());
    } catch {
      showToast('Gagal memuat anggota', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  // ─── SEND TEXT (REAL-TIME) ───
  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');

    try {
      await fetch(`${BASE_URL}/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user?.id, content: text }),
      });
    } catch {
      showToast('Gagal mengirim pesan', 'error');
    }
  };

  // ─── REAL VOICE RECORDING (Web MediaRecorder API) ───
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const startRecording = async () => {
    try {
      if (Platform.OS === 'web') {
        if (!navigator?.mediaDevices?.getUserMedia) {
          showToast('Koneksi HTTP memblokir mikrofon. Gunakan HTTPS atau fitur Teks.', 'error');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Force audio/webm so window.Audio doesn't throw NotSupportedError because of video/webm
        const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? { mimeType: 'audio/webm;codecs=opus' } : (MediaRecorder.isTypeSupported('audio/webm') ? { mimeType: 'audio/webm' } : undefined);
        const mediaRecorder = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e: any) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimer.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      }
    } catch (err) {
      console.error(err);
      showToast('Izin mikrofon diperlukan untuk merekam suara', 'error');
    }
  };

  const cancelRecording = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t: any) => t.stop());
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
    showToast('Rekaman dibatalkan', 'info');
  };

  const stopAndSendRecording = async () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        recorder.stream.getTracks().forEach((t: any) => t.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);

        showToast('Mengirim voice note...', 'info');

        const formData = new FormData();
        formData.append('file', audioBlob, `vn_${Date.now()}.webm`);
        formData.append('sender_id', user.id);

        try {
          const res = await fetch(`${BASE_URL}/api/messages/${id}/upload`, { method: 'POST', body: formData });
          if (!res.ok) showToast('Gagal mengirim voice note', 'error');
        } catch {
          showToast('Terjadi kesalahan', 'error');
        }
        setRecordingDuration(0);
        resolve();
      };

      recorder.stop();
    });
  };

  // ─── AUDIO PLAYBACK (Expo AV) ───
  const handlePlayAudio = async (msgId: number, audioUrl: string) => {
    if (playingAudioId === msgId) {
      if (audioRef.current) { 
        try { await audioRef.current.stopAsync(); await audioRef.current.unloadAsync(); } catch(e){}
        audioRef.current = null; 
      }
      setPlayingAudioId(null);
      setPlaybackProgress(0);
      return;
    }
    
    // Stop previous
    if (audioRef.current) { 
      try {
        (audioRef.current as any).pause();
        (audioRef.current as any).src = '';
      } catch(e){}
      audioRef.current = null; 
    }

    try {
      const audioUrlFull = `${BASE_URL}${audioUrl}`;
      
      // Bypass WebView HTTP block by fetching as Blob first (sama seperti RemoteImage)
      const response = await fetch(audioUrlFull);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Gunakan video element agar bisa memutar container video/webm
      const audio = document.createElement('video');
      audio.src = objectUrl;
      audioRef.current = audio as any;
      setPlayingAudioId(msgId);

      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          setPlaybackProgress(audio.currentTime / audio.duration);
        }
      });

      audio.addEventListener('ended', () => {
        setPlayingAudioId(null);
        setPlaybackProgress(0);
        audioRef.current = null;
        URL.revokeObjectURL(objectUrl);
      });

      await audio.play();
    } catch (e: any) {
      console.error('Audio play error:', e);
      alert(`INFO VN ERROR:\nName: ${e.name}\nMessage: ${e.message}\nString: ${JSON.stringify(e)}\nURL: ${BASE_URL}${audioUrl}`);
    }
  };

  // ─── UPLOAD FILE / PHOTO ───
  const handleUploadFile = async (type: 'image' | 'document') => {
    setIsAttachMenuVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: type === 'image' ? 'image/*' : '*/*' });
      if (result.canceled) return;
      const file = result.assets[0];
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // Gunakan object DOM File asli jika ada, untuk menghindari error fetch URI blob/data
        if (file.file) {
          formData.append('file', file.file);
        } else {
          const response = await fetch(file.uri);
          const blob = await response.blob();
          formData.append('file', blob, file.name);
        }
      } else {
         const webPath = Capacitor.convertFileSrc(file.uri);
         const response = await fetch(webPath);
         const blob = await response.blob();
         formData.append('file', blob, file.name);
      }

      formData.append('sender_id', user.id);
      showToast('Mengunggah file...', 'info');
      const res = await fetch(`${BASE_URL}/api/messages/${id}/upload`, { method: 'POST', body: formData });
      if (!res.ok) {
        const errorText = await res.text();
        alert(`Gagal mengunggah: Server membalas ${res.status} - ${errorText}`);
      }
    } catch (e: any) { 
      console.error(e);
      alert(`Terjadi kesalahan saat unggah: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ─── REAL LOCATION (GPS) ───
  const handleSendLocation = async () => {
    setIsAttachMenuVisible(false);
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'web' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
            const locationText = `📍 Lokasi Saya:\n${mapUrl}`;
            await fetch(`${BASE_URL}/api/messages/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: user?.id, content: locationText }) });
            setIsLoadingLocation(false);
          },
          (error) => {
            console.error(error);
            showToast('Gagal mendapatkan lokasi. Pastikan izin lokasi diaktifkan.', 'error');
            setIsLoadingLocation(false);
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { showToast('Izin lokasi diperlukan', 'error'); setIsLoadingLocation(false); return; }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const { latitude, longitude } = location.coords;
        const mapUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
        const locationText = `📍 Lokasi Saya:\n${mapUrl}`;
        await fetch(`${BASE_URL}/api/messages/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender_id: user?.id, content: locationText }) });
        setIsLoadingLocation(false);
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mendapatkan lokasi', 'error');
      setIsLoadingLocation(false);
    }
  };

  // ─── NAV ───
  const handleBack = () => { router.canGoBack() ? router.back() : router.replace('/(tabs)/chats'); };

  // ─── DETECT TYPE ───
  const isAudioFile = (url: string | null) => url ? /\.(m4a|mp3|wav|ogg|aac|webm)$/i.test(url) : false;
  const isImageFile = (url: string | null) => url ? /\.(jpeg|jpg|gif|png|webp)$/i.test(url) : false;
  const isLocationMessage = (content: string | null) => content ? content.includes('📍') && content.includes('maps.google.com') : false;

  // ─── RENDER MESSAGE ───
  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const showName = index === 0 || messages[index - 1]?.sender_id !== item.sender_id;
    const audioFile = isAudioFile(item.attachment_url);
    const imageFile = isImageFile(item.attachment_url);
    const locationMsg = isLocationMessage(item.content);

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {showName ? (
          <Text style={[styles.senderName, isMe && styles.senderNameMe]}>
            {isMe ? 'Anda' : (item.nama_lengkap || item.username || 'Seseorang')}
          </Text>
        ) : null}

        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>

          {imageFile ? (
            <RemoteImage uri={`${BASE_URL}${item.attachment_url}`} style={styles.attachmentImage} />
          ) : null}

          {audioFile ? (
            <View style={styles.vnContainer}>
              <TouchableOpacity
                style={[styles.vnPlayBtn, isMe ? styles.vnPlayBtnMe : styles.vnPlayBtnOther]}
                onPress={() => handlePlayAudio(item.id, item.attachment_url)}
              >
                <Ionicons name={playingAudioId === item.id ? 'pause' : 'play'} size={20} color={isMe ? '#1A1A1A' : '#FFF'} />
              </TouchableOpacity>
              <View style={styles.vnBody}>
                <View style={styles.vnProgressTrack}>
                  <View style={[styles.vnProgressFill, { width: `${playingAudioId === item.id ? playbackProgress * 100 : 0}%`, backgroundColor: isMe ? '#00E676' : '#075E54' }]} />
                </View>
                <View style={styles.vnWaveform}>
                  {[12,20,14,26,18,28,15,22,10,24,16,20,12,18,8,22,14,20,16,24].map((h, i) => (
                    <View key={i} style={[styles.vnWaveBar, { height: h }, { backgroundColor: playingAudioId === item.id && (i / 20) < playbackProgress ? (isMe ? '#00E676' : '#075E54') : (isMe ? '#666' : '#BBB') }]} />
                  ))}
                </View>
              </View>
              <Ionicons name="mic" size={16} color={isMe ? '#00E676' : '#075E54'} style={{ marginLeft: 6 }} />
            </View>
          ) : null}

          {item.attachment_url && !audioFile && !imageFile ? (
            <TouchableOpacity style={styles.fileLink} onPress={() => Linking.openURL(`${BASE_URL}${item.attachment_url}`)}>
              <Ionicons name="document-text" size={24} color={isMe ? '#F9F6F0' : '#1A1A1A'} />
              <Text style={[styles.fileText, isMe ? styles.messageTextMe : styles.messageTextOther]}>Lihat Dokumen</Text>
            </TouchableOpacity>
          ) : null}

          {locationMsg ? (
            <TouchableOpacity onPress={() => { const m = item.content.match(/https?:\/\/[^\s]+/); if (m) Linking.openURL(m[0]); }}>
              <View style={styles.locationCard}>
                <View style={styles.locationIconRow}>
                  <Ionicons name="location" size={28} color="#E53935" />
                  <Text style={styles.locationTitle}>Lokasi Dibagikan</Text>
                </View>
                <Text style={[styles.locationLink, isMe && { color: '#A5D6A7' }]}>Klik untuk buka di Google Maps →</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {item.content && !locationMsg && !audioFile ? (
            <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>{item.content}</Text>
          ) : null}

          <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={() => { setIsInfoModalVisible(true); fetchGroupMembers(); }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.headerSubtitle}>Klik untuk info grup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => { setIsInfoModalVisible(true); fetchGroupMembers(); }}>
          <Ionicons name="information-circle-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* INFO MODAL */}
      {isInfoModalVisible ? (
        <View style={styles.modalOverlay}>
          <View style={styles.infoModal}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Informasi Grup</Text>
              <TouchableOpacity onPress={() => setIsInfoModalVisible(false)}><Ionicons name="close" size={24} color="#1A1A1A" /></TouchableOpacity>
            </View>
            <View style={styles.groupMetaBox}>
              <View style={styles.lgAvatar}><Text style={styles.lgAvatarText}>{String(name).charAt(0).toUpperCase()}</Text></View>
              <Text style={styles.groupMetaName}>{name}</Text>
              <Text style={styles.groupMetaSub}>{groupMembers.length} Anggota</Text>
            </View>
            <Text style={styles.memberSectionTitle}>Daftar Anggota</Text>
            {loadingMembers ? <ActivityIndicator size="small" color="#1A1A1A" style={{ marginVertical: 20 }} /> : (
              <ScrollView style={styles.memberListScroll}>
                {groupMembers.map(m => (
                  <View key={m.id} style={styles.memberRow}>
                    <View style={styles.smAvatar}><Text style={styles.smAvatarText}>{(m.nama_lengkap || m.username).charAt(0).toUpperCase()}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{m.nama_lengkap || m.username}</Text>
                      <Text style={styles.memberRole}>[{m.role_name || 'Anggota'}] • {m.email}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setIsInfoModalVisible(false)}><Text style={styles.closeInfoBtnText}>Tutup</Text></TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* ATTACHMENT MENU */}
      {isAttachMenuVisible ? (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsAttachMenuVisible(false)} />
          <View style={styles.attachMenu}>
            <Text style={styles.attachMenuTitle}>Bagikan</Text>
            <View style={styles.attachGrid}>
              <TouchableOpacity style={styles.attachOption} onPress={() => handleUploadFile('image')}>
                <View style={[styles.attachIconBg, { backgroundColor: '#E91E63' }]}><Ionicons name="image" size={26} color="#FFF" /></View>
                <Text style={styles.attachLabel}>Foto & Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachOption} onPress={() => handleUploadFile('document')}>
                <View style={[styles.attachIconBg, { backgroundColor: '#9C27B0' }]}><Ionicons name="document-text" size={26} color="#FFF" /></View>
                <Text style={styles.attachLabel}>Dokumen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.attachOption} onPress={handleSendLocation}>
                <View style={[styles.attachIconBg, { backgroundColor: '#4CAF50' }]}><Ionicons name="location" size={26} color="#FFF" /></View>
                <Text style={styles.attachLabel}>Lokasi</Text>
              </TouchableOpacity>
            </View>
            {isLoadingLocation ? <View style={styles.loadingRow}><ActivityIndicator size="small" color="#4CAF50" /><Text style={styles.loadingText}>Mengambil lokasi GPS...</Text></View> : null}
          </View>
        </View>
      ) : null}

      {/* CHAT AREA */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1A1A1A" /></View>
      ) : (
        <FlatList ref={flatListRef} data={messages} keyExtractor={i => i.id.toString()} renderItem={renderMessage} contentContainerStyle={styles.chatContainer} showsVerticalScrollIndicator={false} onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })} />
      )}

      {/* INPUT BAR */}
      {isRecording ? (
        <View style={styles.recordBar}>
          <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn}>
            <Ionicons name="trash" size={22} color="#FF3B30" />
          </TouchableOpacity>
          <Animated.View style={[styles.recordingPulse, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.recordingDot} />
          </Animated.View>
          <Text style={styles.recordTimeText}>{formatDuration(recordingDuration)}</Text>
          <Text style={styles.recordLabel}>Merekam...</Text>
          <TouchableOpacity onPress={stopAndSendRecording} style={styles.recordSendBtn}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputWrapper}>
          <View style={styles.inputPill}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsAttachMenuVisible(true)}>
              <Ionicons name="add" size={24} color="#666" />
            </TouchableOpacity>
            <TextInput style={styles.textInput} placeholder="Ketik pesan..." placeholderTextColor="#999" value={inputText} onChangeText={setInputText} multiline maxLength={2000} />
            {inputText.trim().length > 0 ? (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}><Ionicons name="send" size={18} color="#FFF" /></TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn} onPress={startRecording}><Ionicons name="mic" size={22} color="#1A1A1A" /></TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1EBE1' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: Platform.OS === 'web' ? 16 : 50, backgroundColor: '#F9F6F0', borderBottomWidth: 1, borderBottomColor: '#E0D8C8' },
  headerBtn: { padding: 8, backgroundColor: 'rgba(26,26,26,0.05)', borderRadius: 12 },
  headerInfo: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 11, color: '#888' },
  chatContainer: { padding: 16, paddingBottom: 32 },
  messageRow: { marginBottom: 12, maxWidth: '85%' },
  messageRowMe: { alignSelf: 'flex-end' },
  messageRowOther: { alignSelf: 'flex-start' },
  senderName: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4, marginLeft: 4 },
  senderNameMe: { alignSelf: 'flex-end', marginRight: 4, color: '#A0A0A0' },
  messageBubble: { padding: 12, borderRadius: 18, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  messageBubbleMe: { backgroundColor: '#1A1A1A', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E0D8C8' },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTextMe: { color: '#F9F6F0' },
  messageTextOther: { color: '#1A1A1A' },
  messageTime: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4 },
  messageTimeMe: { color: 'rgba(249,246,240,0.5)' },
  messageTimeOther: { color: '#999' },
  attachmentImage: { width: 220, height: 200, borderRadius: 12, marginBottom: 8 },
  fileLink: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 10, borderRadius: 10, marginBottom: 8 },
  fileText: { marginLeft: 8, textDecorationLine: 'underline', fontWeight: 'bold' },
  locationCard: { padding: 10, borderRadius: 12, marginBottom: 4 },
  locationIconRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  locationTitle: { fontSize: 14, fontWeight: 'bold', color: '#E53935', marginLeft: 8 },
  locationLink: { fontSize: 13, color: '#2196F3', textDecorationLine: 'underline' },
  vnContainer: { flexDirection: 'row', alignItems: 'center', minWidth: 200, paddingVertical: 4 },
  vnPlayBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  vnPlayBtnMe: { backgroundColor: '#F9F6F0' },
  vnPlayBtnOther: { backgroundColor: '#1A1A1A' },
  vnBody: { flex: 1 },
  vnProgressTrack: { height: 3, backgroundColor: '#444', borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  vnProgressFill: { height: '100%', borderRadius: 2 },
  vnWaveform: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  vnWaveBar: { width: 3, borderRadius: 2 },
  inputWrapper: { padding: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 12, backgroundColor: '#F1EBE1' },
  inputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 28, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#E0D8C8', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  iconBtn: { padding: 6 },
  textInput: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 8, maxHeight: 100 },
  micBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  recordBar: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0D8C8' },
  recordCancelBtn: { padding: 8 },
  recordingPulse: { marginLeft: 12 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30' },
  recordTimeText: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 10 },
  recordLabel: { fontSize: 13, color: '#888', marginLeft: 8, flex: 1 },
  recordSendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 20 },
  infoModal: { width: '100%', maxWidth: 450, maxHeight: '80%', backgroundColor: '#FFF', borderRadius: 24, padding: 20 },
  infoModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  infoModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  groupMetaBox: { alignItems: 'center', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E0D8C8' },
  lgAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  lgAvatarText: { fontSize: 28, fontWeight: 'bold', color: '#1A1A1A' },
  groupMetaName: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  groupMetaSub: { fontSize: 12, color: '#666', marginTop: 2 },
  memberSectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
  memberListScroll: { maxHeight: 200, marginBottom: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9F6F0' },
  smAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  smAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  memberName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  memberRole: { fontSize: 11, color: '#888' },
  closeInfoBtn: { backgroundColor: '#1A1A1A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  closeInfoBtnText: { color: '#FFF', fontWeight: 'bold' },
  attachMenu: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  attachMenuTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 16 },
  attachOption: { alignItems: 'center', width: '30%', marginBottom: 12 },
  attachIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  attachLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  loadingText: { marginLeft: 8, fontSize: 13, color: '#666' },
});
