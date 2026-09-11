import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Linking, ScrollView, Animated, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Toast, ToastType } from '../../components/Toast';
import { API_BASE_URL as BASE_URL, getFileUrl, authFetch, getAuthHeaders } from '../../config/api';
import { socket } from '../../services/socket';
import { Capacitor } from '@capacitor/core';
import { Image as ExpoImage } from 'expo-image';

// ─── REMOTE IMAGE COMPONENT (FIX FOR ANDROID WEBVIEW CORS/BLOB) ───
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
    return (
      <View style={[style, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }
  return <ExpoImage source={{ uri: blobUri }} style={style} contentFit="contain" />;
};

export default function ChatRoom() {
  const { id, name } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  // In-Chat Search State
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Typing Indicator State
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const typingTimeoutRef = useRef<any>(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingTimer = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // Playback state
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<any>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Location
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Full Screen Image Modal
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // Info Modal & 4 Tabs State
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [infoActiveTab, setInfoActiveTab] = useState<'members' | 'briefing' | 'checklist' | 'media'>('members');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Tab Briefing State
  const [groupDetail, setGroupDetail] = useState<any>(null);
  const [isEditingBriefing, setIsEditingBriefing] = useState(false);
  const [briefingForm, setBriefingForm] = useState({
    call_time: '',
    show_time: '',
    venue_address: '',
    dresscode: '',
    rundown_notes: '',
  });

  // Tab Checklist State
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklistCategory, setSelectedChecklistCategory] = useState('Semua');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Alat Musik');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Tab Media State
  const [groupMedia, setGroupMedia] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Pinned Message State
  const [pinnedMessage, setPinnedMessage] = useState<any>(null);

  // Message Options Modal (Reactions, Edit, Delete, Pin, Reply)
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isMsgOptionsVisible, setIsMsgOptionsVisible] = useState(false);

  // Edit Mode State
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);

  // Mentions
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);

  // Stickers
  const [isStickerMenuVisible, setIsStickerMenuVisible] = useState(false);
  const STICKERS = [
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f602/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f62d/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f92f/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f973/512.gif',
    'https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif',
  ];

  // Reply Message
  const [replyingToMessage, setReplyingToMessage] = useState<any>(null);

  // Attachment menu
  const [isAttachMenuVisible, setIsAttachMenuVisible] = useState(false);

  // Multi-upload Preview
  const [selectedUploads, setSelectedUploads] = useState<any[]>([]);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [isUploadingMulti, setIsUploadingMulti] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ uploading: boolean; percent: number; fileName: string }>({
    uploading: false,
    percent: 0,
    fileName: '',
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as ToastType });
  const flatListRef = useRef<FlatList>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  useEffect(() => {
    loadUserAndData();

    socket.emit('join_group', id);

    // ⚡ REAL-TIME SOCKET LISTENERS
    socket.on('receive_message', (newMsg: any) => {
      setMessages((prev) => {
        // If message with this real ID is already present, do nothing
        if (prev.some(m => m.id === newMsg.id)) return prev;

        // If this matches our pending message via temp_id
        if (newMsg.temp_id && prev.some(m => m.id === newMsg.temp_id || m.temp_id === newMsg.temp_id)) {
          return prev.map(m => (m.id === newMsg.temp_id || m.temp_id === newMsg.temp_id) ? { ...newMsg, status: 'sent' } : m);
        }

        // Fallback matching if sender is current user and content matches
        if (newMsg.sender_id === user?.id) {
          const pendingIdx = prev.findIndex(m => m.status === 'pending' && m.content === newMsg.content);
          if (pendingIdx !== -1) {
            const updated = [...prev];
            updated[pendingIdx] = { ...newMsg, status: 'sent' };
            return updated;
          }
        }

        return [...prev, newMsg];
      });

      // If we are currently active on this screen and someone else sent this message, mark it as read immediately
      if (user?.id && newMsg.sender_id !== user?.id) {
        authFetch(`${BASE_URL}/api/messages/${id}/read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id }),
        }).catch(() => {});
      }

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('message_reacted', (data: { messageId: number, reactions: any[] }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
    });

    socket.on('message_edited', (data: { messageId: number, content: string, is_edited: boolean }) => {
      setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, content: data.content, is_edited: true } : m));
    });

    socket.on('message_deleted', (data: { messageId: number }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    socket.on('message_pinned', (data: { groupId: number, pinnedMessage: any }) => {
      if (data.groupId.toString() === id?.toString()) {
        setPinnedMessage(data.pinnedMessage);
      }
    });

    socket.on('messages_read', (data: { groupId: number, user_id: number }) => {
      if (data.groupId.toString() === id?.toString() && data.user_id !== user?.id) {
        setMessages(prev => prev.map(m => m.sender_id === user?.id ? { ...m, read_count: Math.max(1, Number(m.read_count || 0) + 1) } : m));
      }
    });

    socket.on('group_deleted', (data: any) => {
      if (data.groupId.toString() === id?.toString()) {
        showToast('Grup ini telah dibubarkan oleh Admin.', 'info');
        setTimeout(() => router.replace('/(tabs)/chats'), 1500);
      }
    });

    // ⚡ TYPING INDICATOR REAL-TIME
    socket.on('user_typing', (data: { user_id: number, username: string, isTyping: boolean }) => {
      if (data.user_id !== user?.id) {
        setTypingUsers(prev => {
          const copy = { ...prev };
          if (data.isTyping) {
            copy[data.user_id] = data.username;
          } else {
            delete copy[data.user_id];
          }
          return copy;
        });
      }
    });

    // ⚡ BRIEFING & CHECKLIST REAL-TIME
    socket.on('update_group_briefing', (data: any) => {
      if (data.groupId?.toString() === id?.toString()) {
        fetchGroupDetail();
      }
    });

    socket.on('checklist_updated', (data: any) => {
      if (data.groupId?.toString() === id?.toString()) {
        fetchChecklists();
      }
    });

    return () => {
      socket.emit('leave_group', id);
      socket.off('receive_message');
      socket.off('message_reacted');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('message_pinned');
      socket.off('messages_read');
      socket.off('group_deleted');
      socket.off('user_typing');
      socket.off('update_group_briefing');
      socket.off('checklist_updated');
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
        audioRef.current = null;
      }
    };
  }, [id, user?.id]);

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
    }
  }, [isRecording]);

  const loadUserAndData = async () => {
    try {
      const userStr = (await AsyncStorage.getItem('userData')) || (await AsyncStorage.getItem('user'));
      if (!userStr) {
        showToast('Sesi login tidak ditemukan', 'error');
        setTimeout(() => router.replace('/login'), 1500);
        return;
      }
      const userData = JSON.parse(userStr);
      setUser(userData);

      fetchMessages();
      fetchGroupMembers();
      fetchPinnedMessage();

      // Mark read
      authFetch(`${BASE_URL}/api/messages/${id}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userData.id }),
      }).catch(() => {});

    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/messages/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      showToast('Gagal memuat pesan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPinnedMessage = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/messages/groups/${id}/pinned`);
      if (res.ok) {
        const data = await res.json();
        setPinnedMessage(data);
      }
    } catch {}
  };

  const fetchGroupMembers = async () => {
    try {
      setLoadingMembers(true);
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/members`);
      if (res.ok) {
        const data = await res.json();
        setGroupMembers(data);
      }
    } catch {
      showToast('Gagal memuat anggota', 'error');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchGroupDetail = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/detail`);
      if (res.ok) {
        const data = await res.json();
        setGroupDetail(data);
        setBriefingForm({
          call_time: data.call_time || '',
          show_time: data.show_time || '',
          venue_address: data.venue_address || '',
          dresscode: data.dresscode || '',
          rundown_notes: data.rundown_notes || '',
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveBriefing = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/briefing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...briefingForm, user_id: user?.id }),
      });
      if (res.ok) {
        showToast('Briefing & Rundown disimpan!', 'success');
        setIsEditingBriefing(false);
        fetchGroupDetail();
      } else {
        showToast('Gagal menyimpan briefing', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan', 'error');
    }
  };

  const fetchChecklists = async () => {
    try {
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/checklist`);
      if (res.ok) {
        const data = await res.json();
        setChecklists(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (itemId: number) => {
    try {
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/checklist/${itemId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id }),
      });
      if (res.ok) {
        fetchChecklists();
      }
    } catch {}
  };

  const handleAddChecklistItem = async () => {
    if (!newItemName.trim()) {
      showToast('Nama barang wajib diisi', 'error');
      return;
    }
    try {
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: newItemName.trim(),
          category: newItemCategory,
          user_id: user?.id,
        }),
      });
      if (res.ok) {
        setNewItemName('');
        setIsAddingItem(false);
        fetchChecklists();
        showToast('Item checklist ditambahkan!', 'success');
      }
    } catch {}
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    try {
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/checklist/${itemId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchChecklists();
        showToast('Item dihapus', 'info');
      }
    } catch {}
  };

  const fetchGroupMedia = async () => {
    try {
      setLoadingMedia(true);
      const res = await authFetch(`${BASE_URL}/api/groups/${id}/media`);
      if (res.ok) {
        const data = await res.json();
        setGroupMedia(data);
      }
    } catch {} finally {
      setLoadingMedia(false);
    }
  };

  const openInfoModalWithData = () => {
    setIsInfoModalVisible(true);
    fetchGroupMembers();
    fetchGroupDetail();
    fetchChecklists();
    fetchGroupMedia();
  };

  const openWhatsApp = (phone?: string | null) => {
    if (!phone) return;
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) cleaned = '62' + cleaned.slice(1);
    if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
    Linking.openURL(`https://wa.me/${cleaned}`);
  };

  // ─── MENTIONS & TYPING ───
  const handleTextChange = (text: string) => {
    setInputText(text);

    // Typing start emit
    if (user?.id) {
      socket.emit('typing_start', { groupId: id, user_id: user.id, username: user.nama_lengkap || user.username });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { groupId: id, user_id: user.id });
      }, 2500);
    }

    const lastWord = text.split(' ').pop();
    if (lastWord !== undefined && lastWord.startsWith('@')) {
      const query = lastWord.substring(1).toLowerCase();
      setMentionQuery(query);
      if (groupMembers.length > 0) {
        setFilteredMembers(groupMembers.filter(m =>
          (m.nama_lengkap || '').toLowerCase().includes(query) ||
          (m.username || '').toLowerCase().includes(query)
        ));
      }
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (member: any) => {
    const words = inputText.split(' ');
    words.pop();
    const nameToTag = member.nama_lengkap || member.username;
    const newText = [...words, `@${nameToTag} `].join(' ').trimStart();
    setInputText(newText);
    setMentionQuery(null);
  };

  // ─── RETRY FAILED MESSAGE ───
  const handleRetryMessage = async (msg: any) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'pending' } : m));
    try {
      const res = await authFetch(`${BASE_URL}/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, content: msg.content, payload: msg.payload, temp_id: msg.temp_id || msg.id }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const serverMsg = json.data;
        if (serverMsg) {
          setMessages(prev => {
            if (prev.some(m => m.id === serverMsg.id)) {
              return prev.filter(m => m.id !== msg.id);
            }
            return prev.map(m => m.id === msg.id ? { ...serverMsg, status: 'sent' } : m);
          });
        }
      } else {
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
        showToast('Gagal mengirim ulang pesan', 'error');
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'failed' } : m));
      showToast('Gagal mengirim ulang pesan', 'error');
    }
  };

  // ─── SEND / EDIT TEXT MESSAGE ───
  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text) return;

    if (!user || !user.id) {
      showToast('Sesi login telah berakhir', 'error');
      setTimeout(() => router.replace('/login'), 1500);
      return;
    }

    // Stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    socket.emit('typing_stop', { groupId: id, user_id: user.id });

    // IF EDITING EXISTING MESSAGE
    if (editingMessageId) {
      try {
        const res = await authFetch(`${BASE_URL}/api/messages/${editingMessageId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, content: text }),
        });
        if (res.ok) {
          showToast('Pesan berhasil di-edit', 'success');
        } else {
          showToast('Gagal meng-edit pesan', 'error');
        }
      } catch {
        showToast('Gagal meng-edit pesan', 'error');
      } finally {
        setInputText('');
        setEditingMessageId(null);
      }
      return;
    }

    setInputText('');

    let payload = null;
    if (replyingToMessage) {
      payload = {
        reply_to: {
          id: replyingToMessage.id,
          sender_name: replyingToMessage.nama_lengkap || replyingToMessage.username,
          content: replyingToMessage.content,
          attachment_url: replyingToMessage.attachment_url,
        }
      };
      setReplyingToMessage(null);
    }

    // 🕒 CREATE OPTIMISTIC PENDING MESSAGE (INSTANT FEEDBACK)
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const pendingMsg: any = {
      id: tempId,
      temp_id: tempId,
      group_id: Number(id),
      sender_id: user.id,
      username: user.username,
      nama_lengkap: user.nama_lengkap || user.username,
      content: text,
      attachment_url: null,
      payload,
      created_at: new Date().toISOString(),
      read_count: 0,
      reactions: [],
      status: 'pending',
    };

    setMessages(prev => [...prev, pendingMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await authFetch(`${BASE_URL}/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, content: text, payload, temp_id: tempId }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const serverMsg = json.data;
        if (serverMsg) {
          setMessages(prev => {
            if (prev.some(m => m.id === serverMsg.id)) {
              return prev.filter(m => m.id !== tempId);
            }
            return prev.map(m => m.id === tempId ? { ...serverMsg, status: 'sent' } : m);
          });
        }
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Gagal mengirim pesan', 'error');
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      showToast('Gagal mengirim pesan', 'error');
    }
  };

  // ─── EMOJI REACTION ───
  const handleReactMessage = async (msg: any, emoji: string) => {
    setIsMsgOptionsVisible(false);
    try {
      await authFetch(`${BASE_URL}/api/messages/${msg.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, emoji }),
      });
    } catch {
      showToast('Gagal memberikan reaksi', 'error');
    }
  };

  // ─── PIN MESSAGE ───
  const handlePinMessage = async (msg: any) => {
    setIsMsgOptionsVisible(false);
    try {
      const res = await authFetch(`${BASE_URL}/api/messages/groups/${id}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user?.id, message_id: msg?.id }),
      });
      if (res.ok) {
        showToast(msg ? 'Pesan berhasil disematkan!' : 'Pesan dilepas dari pin', 'success');
      }
    } catch {
      showToast('Gagal menyematkan pesan', 'error');
    }
  };

  // ─── DELETE FOR EVERYONE ───
  const handleDeleteMessage = async (msg: any) => {
    setIsMsgOptionsVisible(false);
    try {
      const res = await authFetch(`${BASE_URL}/api/messages/${msg.id}?user_id=${user?.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Pesan telah dihapus untuk semua orang', 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Gagal menghapus pesan', 'error');
      }
    } catch {
      showToast('Gagal menghapus pesan', 'error');
    }
  };

  // ─── SEND STICKER ───
  const handleSendSticker = async (stickerUrl: string) => {
    setIsStickerMenuVisible(false);

    let payload = null;
    if (replyingToMessage) {
      payload = {
        reply_to: {
          id: replyingToMessage.id,
          sender_name: replyingToMessage.nama_lengkap || replyingToMessage.username,
          content: replyingToMessage.content,
          attachment_url: replyingToMessage.attachment_url,
        }
      };
      setReplyingToMessage(null);
    }

    const tempId = `temp_stk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const pendingMsg: any = {
      id: tempId,
      temp_id: tempId,
      group_id: Number(id),
      sender_id: user?.id,
      username: user?.username,
      nama_lengkap: user?.nama_lengkap || user?.username,
      content: `[STICKER:${stickerUrl}]`,
      attachment_url: null,
      payload,
      created_at: new Date().toISOString(),
      read_count: 0,
      reactions: [],
      status: 'pending',
    };

    setMessages(prev => [...prev, pendingMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const res = await authFetch(`${BASE_URL}/api/messages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user?.id, content: `[STICKER:${stickerUrl}]`, payload, temp_id: tempId }),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const serverMsg = json.data;
        if (serverMsg) {
          setMessages(prev => {
            if (prev.some(m => m.id === serverMsg.id)) {
              return prev.filter(m => m.id !== tempId);
            }
            return prev.map(m => m.id === tempId ? { ...serverMsg, status: 'sent' } : m);
          });
        }
      } else {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        showToast('Gagal mengirim stiker', 'error');
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
      showToast('Gagal mengirim stiker', 'error');
    }
  };

  // ─── REAL VOICE RECORDING (WITH CROSS-PLATFORM TIMER & CANCEL) ───
  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
          else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
          else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
          else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        }

        const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e: any) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.start(200);
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
        setRecordingDuration(0);
        recordingTimer.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      } else {
        showToast('Mikrofon tidak didukung di perangkat ini.', 'error');
      }
    } catch (err) {
      console.error('Recording error:', err);
      showToast('Izin mikrofon diperlukan untuk merekam suara.', 'error');
    }
  };

  const cancelRecording = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t: any) => t.stop());
      } catch (e) {}
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
        try {
          recorder.stream.getTracks().forEach((t: any) => t.stop());
        } catch (e) {}

        const mimeType = recorder.mimeType || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : (mimeType.includes('ogg') ? 'ogg' : 'webm');
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);

        showToast('Mengirim voice note...', 'info');

        const formData = new FormData();
        formData.append('file', audioBlob, `vn_${Date.now()}.${ext}`);
        formData.append('sender_id', user.id);

        if (replyingToMessage) {
          formData.append('payload', JSON.stringify({
            reply_to: {
              id: replyingToMessage.id,
              sender_name: replyingToMessage.nama_lengkap || replyingToMessage.username,
              content: replyingToMessage.content,
              attachment_url: replyingToMessage.attachment_url,
            }
          }));
          setReplyingToMessage(null);
        }

        try {
          const res = await authFetch(`${BASE_URL}/api/messages/${id}/upload`, { method: 'POST', body: formData });
          if (res.ok) showToast('Voice Note terkirim!', 'success');
          else showToast('Gagal mengirim voice note', 'error');
        } catch {
          showToast('Terjadi kesalahan saat mengirim VN', 'error');
        }
        setRecordingDuration(0);
        resolve();
      };

      try {
        recorder.stop();
      } catch (e) {
        cancelRecording();
        resolve();
      }
    });
  };

  // ─── AUDIO PLAYBACK ───
  const handlePlayAudio = async (msgId: number, audioUrl: string) => {
    if (playingAudioId === msgId) {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch (e) {}
        audioRef.current = null;
      }
      setPlayingAudioId(null);
      setPlaybackProgress(0);
      return;
    }

    if (audioRef.current) {
      try { audioRef.current.pause(); } catch (e) {}
      audioRef.current = null;
    }

    try {
      const fullUrl = `${BASE_URL}${audioUrl}`;
      const audio = new Audio(fullUrl);
      audioRef.current = audio;
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
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        showToast('Gagal memutar Voice Note', 'error');
        setPlayingAudioId(null);
        setPlaybackProgress(0);
      });

      await audio.play();
    } catch (e) {
      console.error('Play audio exception:', e);
      showToast('Gagal memutar audio', 'error');
      setPlayingAudioId(null);
    }
  };

  // ─── UPLOAD FILE / PHOTO ───
  const handleUploadFile = async (type: 'image' | 'document') => {
    setIsAttachMenuVisible(false);
    try {
      let selectedFiles: any[] = [];

      if (type === 'image' && Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          showToast('Izin galeri diperlukan untuk memilih foto.', 'error');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsMultipleSelection: true,
          selectionLimit: 10,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          selectedFiles = result.assets.map(asset => ({
            uri: asset.uri,
            name: asset.fileName || `foto_${Date.now()}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          }));
        }
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: type === 'image' ? 'image/*' : '*/*',
          copyToCacheDirectory: true,
          multiple: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          selectedFiles = result.assets.map(asset => ({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || 'application/octet-stream',
            file: asset.file,
          }));
        }
      }

      if (selectedFiles.length === 0) return;

      if (selectedFiles.length === 1) {
        await uploadSingleFile(selectedFiles[0]);
      } else {
        setSelectedUploads(selectedFiles);
        setIsPreviewModalVisible(true);
      }
    } catch (err) {
      console.error('Pick error:', err);
      showToast('Gagal memilih file', 'error');
    }
  };

  const uploadFormDataWithProgress = (formData: FormData, fileName: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setUploadStatus({ uploading: true, percent: 0, fileName });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/api/messages/${id}/upload`);

      getAuthHeaders().then(authHeaders => {
        if (authHeaders['Authorization']) {
          xhr.setRequestHeader('Authorization', authHeaders['Authorization']);
        }
        xhr.send(formData);
      }).catch(() => {
        xhr.send(formData);
      });

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          setUploadStatus({ uploading: true, percent, fileName });
        }
      };

      xhr.onload = () => {
        setUploadStatus({ uploading: true, percent: 100, fileName });
        setTimeout(() => {
          setUploadStatus({ uploading: false, percent: 0, fileName: '' });
        }, 500);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      xhr.onerror = () => {
        setUploadStatus({ uploading: false, percent: 0, fileName: '' });
        resolve(false);
      };
    });
  };

  const uploadSingleFile = async (file: any) => {
    const fileName = file.name || 'foto.jpg';
    const formData = new FormData();

    if (Platform.OS === 'web') {
      if (file.file) {
        formData.append('file', file.file);
      } else {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, fileName);
      }
    } else {
      formData.append('file', {
        uri: file.uri,
        name: fileName,
        type: file.mimeType || 'image/jpeg',
      } as any);
    }

    formData.append('sender_id', user.id.toString());
    formData.append('file_name', fileName);

    if (replyingToMessage) {
      formData.append('payload', JSON.stringify({
        reply_to: {
          id: replyingToMessage.id,
          sender_name: replyingToMessage.nama_lengkap || replyingToMessage.username,
          content: replyingToMessage.content,
          attachment_url: replyingToMessage.attachment_url,
        }
      }));
      setReplyingToMessage(null);
    }

    try {
      const success = await uploadFormDataWithProgress(formData, fileName);
      if (success) showToast('File berhasil dikirim!', 'success');
      else showToast('Gagal mengunggah file', 'error');
    } catch {
      showToast('Gagal mengunggah file', 'error');
    }
  };

  const handleConfirmMultiUpload = async () => {
    setIsUploadingMulti(true);
    let successCount = 0;
    const total = selectedUploads.length;

    for (let i = 0; i < total; i++) {
      const file = selectedUploads[i];
      const fileName = `(${i + 1}/${total}) ${file.name || 'foto.jpg'}`;
      try {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          if (file.file) {
            formData.append('file', file.file);
          } else {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            formData.append('file', blob, file.name || 'foto.jpg');
          }
        } else {
          const webPath = Capacitor.convertFileSrc(file.uri);
          const response = await fetch(webPath);
          const blob = await response.blob();
          formData.append('file', blob, file.name || 'foto.jpg');
        }

        formData.append('sender_id', user.id);
        const ok = await uploadFormDataWithProgress(formData, fileName);
        if (ok) successCount++;
      } catch (e) {
        console.error('Multi upload error on item', i, e);
      }
    }

    setIsUploadingMulti(false);
    setIsPreviewModalVisible(false);
    setSelectedUploads([]);
    showToast(`Berhasil mengirim ${successCount} dari ${total} file`, successCount === total ? 'success' : 'info');
  };

  // ─── SHARE GPS LOCATION ───
  const handleSendLocation = async () => {
    setIsAttachMenuVisible(false);
    setIsLoadingLocation(true);

    const sendCoords = async (latitude: number, longitude: number) => {
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const content = `📍 [LOKASI SAYA] - ${latitude.toFixed(5)}, ${longitude.toFixed(5)}\n${mapsUrl}`;

      let payload = null;
      if (replyingToMessage) {
        payload = {
          reply_to: {
            id: replyingToMessage.id,
            sender_name: replyingToMessage.nama_lengkap || replyingToMessage.username,
            content: replyingToMessage.content,
            attachment_url: replyingToMessage.attachment_url,
          }
        };
        setReplyingToMessage(null);
      }

      const tempId = `temp_loc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const pendingMsg: any = {
        id: tempId,
        temp_id: tempId,
        group_id: Number(id),
        sender_id: user?.id,
        username: user?.username,
        nama_lengkap: user?.nama_lengkap || user?.username,
        content,
        attachment_url: null,
        payload,
        created_at: new Date().toISOString(),
        read_count: 0,
        reactions: [],
        status: 'pending',
      };

      setMessages(prev => [...prev, pendingMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

      try {
        const res = await authFetch(`${BASE_URL}/api/messages/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender_id: user?.id, content, payload, temp_id: tempId }),
        });
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const serverMsg = json.data;
          if (serverMsg) {
            setMessages(prev => {
              if (prev.some(m => m.id === serverMsg.id)) {
                return prev.filter(m => m.id !== tempId);
              }
              return prev.map(m => m.id === tempId ? { ...serverMsg, status: 'sent' } : m);
            });
          }
          showToast('Lokasi GPS berhasil dibagikan!', 'success');
        } else {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
          showToast('Gagal membagikan lokasi', 'error');
        }
      } catch {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m));
        showToast('Gagal membagikan lokasi', 'error');
      } finally {
        setIsLoadingLocation(false);
      }
    };

    const getBrowserCoords = (highAccuracy: boolean, timeoutMs: number): Promise<{ latitude: number, longitude: number }> => {
      return new Promise((resolve, reject) => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          reject(new Error('Perangkat tidak mendukung GPS Geolocation'));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          (err) => reject(err),
          { enableHighAccuracy: highAccuracy, timeout: timeoutMs, maximumAge: 30000 }
        );
      });
    };

    try {
      try {
        const coords = await getBrowserCoords(true, 10000);
        await sendCoords(coords.latitude, coords.longitude);
        return;
      } catch (highErr: any) {
        console.warn('GPS akurasi tinggi timeout, mencoba fallback jaringan...', highErr);
      }

      const fallbackCoords = await getBrowserCoords(false, 15000);
      await sendCoords(fallbackCoords.latitude, fallbackCoords.longitude);
    } catch (err: any) {
      console.error('Location acquisition error:', err);
      let msg = 'Gagal mendapatkan lokasi. Pastikan GPS aktif.';
      if (err?.code === 1) msg = 'Izin lokasi ditolak.';
      else if (err?.code === 2) msg = 'Titik lokasi tidak ditemukan.';
      else if (err?.code === 3) msg = 'Pencarian lokasi timeout.';
      showToast(msg, 'error');
      setIsLoadingLocation(false);
    }
  };

  // ─── NAV ───
  const handleBack = () => { router.canGoBack() ? router.back() : router.replace('/(tabs)/chats'); };

  // ─── DETECT FILE TYPE ───
  const isAudioFile = (url: string | null) => url ? /\.(m4a|mp3|wav|ogg|aac|webm)$/i.test(url) : false;
  const isImageFile = (url: string | null) => url ? /\.(jpeg|jpg|gif|png|webp)$/i.test(url) : false;

  const renderMessageContent = (content: string, isMe: boolean) => {
    if (!content) return null;
    const parts = content.split(/(@\w+(?:\s+\w+)?)/g);
    return (
      <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            return (
              <Text key={index} style={[styles.mentionText, isMe ? styles.mentionTextMe : styles.mentionTextOther]}>
                {part}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  // Filter messages for in-chat search
  const displayMessages = isSearching && searchQuery.trim()
    ? messages.filter(m => m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === user?.id;
    const isSticker = item.content && item.content.startsWith('[STICKER:') && item.content.endsWith(']');
    const stickerUrl = isSticker ? item.content.slice(9, -1) : null;
    const audioFile = isAudioFile(item.attachment_url);
    const imageFile = isImageFile(item.attachment_url);
    const locationMsg = item.content && item.content.startsWith('📍 [LOKASI SAYA]');
    const reactions = item.reactions || [];

    let replyData = null;
    if (item.payload && typeof item.payload === 'object' && item.payload.reply_to) {
      replyData = item.payload.reply_to;
    }

    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        {!isMe && <Text style={styles.senderName}>{item.sender_name || item.username}</Text>}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            if (item.status === 'failed') {
              Alert.alert('Pesan Gagal Dikirim', 'Apakah Anda ingin mengirim ulang pesan ini?', [
                { text: 'Batal', style: 'cancel' },
                { text: 'Kirim Ulang', onPress: () => handleRetryMessage(item) }
              ]);
            }
          }}
          onLongPress={() => {
            if (item.status === 'pending') return;
            setSelectedMessage(item);
            setIsMsgOptionsVisible(true);
          }}
        >
          <View style={[
            styles.messageBubble,
            isMe ? styles.messageBubbleMe : styles.messageBubbleOther,
            isSticker && styles.messageStickerBubble
          ]}>
            {/* QUOTE REPLY BAR */}
            {replyData && (
              <View style={[styles.replyQuoteBox, isMe ? styles.replyQuoteBoxMe : styles.replyQuoteBoxOther]}>
                <Text style={[styles.replyQuoteName, isMe ? styles.replyQuoteNameMe : styles.replyQuoteNameOther]}>
                  {replyData.sender_name}
                </Text>
                <Text style={[styles.replyQuoteText, isMe ? styles.replyQuoteTextMe : styles.replyQuoteTextOther]} numberOfLines={1}>
                  {replyData.content ? (replyData.content.startsWith('[STICKER:') ? 'Stiker' : replyData.content) : 'Foto / File'}
                </Text>
              </View>
            )}

            {/* STICKER */}
            {isSticker && stickerUrl ? (
              <RemoteImage uri={stickerUrl} style={styles.stickerImage} />
            ) : null}

            {/* IMAGE ATTACHMENT */}
            {item.attachment_url && imageFile ? (
              <TouchableOpacity onPress={() => setFullScreenImage(`${BASE_URL}${item.attachment_url}`)}>
                <RemoteImage uri={`${BASE_URL}${item.attachment_url}`} style={styles.attachmentImage} />
              </TouchableOpacity>
            ) : null}

            {/* AUDIO / VOICE NOTE */}
            {item.attachment_url && audioFile ? (
              <View style={styles.vnContainer}>
                <TouchableOpacity
                  style={[styles.vnPlayBtn, isMe ? styles.vnPlayBtnMe : styles.vnPlayBtnOther]}
                  onPress={() => handlePlayAudio(item.id, item.attachment_url)}
                >
                  <Ionicons
                    name={playingAudioId === item.id ? "pause" : "play"}
                    size={20}
                    color={isMe ? '#1A1A1A' : '#FFF'}
                  />
                </TouchableOpacity>
                <View style={styles.vnBody}>
                  <View style={styles.vnProgressTrack}>
                    <View
                      style={[
                        styles.vnProgressFill,
                        {
                          width: `${playingAudioId === item.id ? playbackProgress * 100 : 0}%`,
                          backgroundColor: isMe ? '#F9F6F0' : '#1A1A1A',
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.vnWaveform}>
                    {[4, 8, 14, 20, 10, 16, 24, 18, 12, 6, 15, 22, 11, 7].map((h, i) => (
                      <View
                        key={i}
                        style={[
                          styles.vnWaveBar,
                          {
                            height: h,
                            backgroundColor: isMe ? 'rgba(249,246,240,0.5)' : 'rgba(26,26,26,0.3)',
                          },
                        ]}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {/* DOCUMENT ATTACHMENT */}
            {item.attachment_url && !audioFile && !imageFile ? (
              <TouchableOpacity style={styles.fileLink} onPress={() => Linking.openURL(`${BASE_URL}${item.attachment_url}`)}>
                <Ionicons name="document-text" size={24} color={isMe ? '#F9F6F0' : '#1A1A1A'} />
                <Text style={[styles.fileText, isMe ? styles.messageTextMe : styles.messageTextOther]}>Lihat Dokumen</Text>
              </TouchableOpacity>
            ) : null}

            {/* LOCATION */}
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

            {/* TEXT CONTENT */}
            {item.content && !locationMsg && !audioFile && !isSticker ? renderMessageContent(item.content, isMe) : null}

            {/* EMOJI REACTION PILLS */}
            {reactions.length > 0 && (
              <View style={styles.reactionsRow}>
                {reactions.map((r: any, idx: number) => (
                  <View key={idx} style={styles.reactionPill}>
                    <Text style={styles.reactionEmojiText}>{r.emoji}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* TIME & STATUS CENTANG */}
            <View style={[styles.timeRow, isSticker && { alignSelf: isMe ? 'flex-end' : 'flex-start' }]}>
              {item.is_edited && <Text style={[styles.editedTag, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>edited • </Text>}
              <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther, isSticker && { color: '#999' }]}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMe && (
                item.status === 'pending' ? (
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={isSticker ? "#999" : "rgba(249,246,240,0.6)"}
                    style={{ marginLeft: 4 }}
                  />
                ) : item.status === 'failed' ? (
                  <Ionicons
                    name="alert-circle"
                    size={14}
                    color="#EF5350"
                    style={{ marginLeft: 4 }}
                  />
                ) : (
                  <Ionicons
                    name={Number(item.read_count || 0) > 0 ? "checkmark-done" : "checkmark"}
                    size={15}
                    color={Number(item.read_count || 0) > 0 ? "#64B5F6" : (isSticker ? "#999" : "rgba(249,246,240,0.6)")}
                    style={{ marginLeft: 4 }}
                  />
                )
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Categorized Checklists
  const filteredChecklists = checklists.filter(c => {
    if (selectedChecklistCategory === 'Semua') return true;
    return c.category === selectedChecklistCategory;
  });

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerInfo} onPress={openInfoModalWithData}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.headerTitle} numberOfLines={1}>{name}</Text>
            <View style={styles.onlineBadgeDot} />
          </View>
          <Text style={styles.headerSubtitle}>
            {groupMembers.length} Anggota • Ketuk Info & Checklist
          </Text>
        </TouchableOpacity>

        {/* SEARCH BUTTON */}
        <TouchableOpacity
          style={[styles.headerBtn, { marginRight: 8 }]}
          onPress={() => {
            setIsSearching(!isSearching);
            if (isSearching) setSearchQuery('');
          }}
        >
          <Ionicons name={isSearching ? "close" : "search"} size={22} color="#1A1A1A" />
        </TouchableOpacity>

        {/* INFO BUTTON */}
        <TouchableOpacity style={styles.headerBtn} onPress={openInfoModalWithData}>
          <Ionicons name="information-circle-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* IN-CHAT MESSAGE SEARCH BAR */}
      {isSearching && (
        <View style={styles.inChatSearchBar}>
          <Ionicons name="search" size={16} color="#666" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.inChatSearchInput}
            placeholder="Cari pesan di obrolan..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={16} color="#999" />
            </TouchableOpacity>
          )}
          {searchQuery.trim().length > 0 && (
            <Text style={styles.searchCountBadge}>
              {displayMessages.length} ditemukan
            </Text>
          )}
        </View>
      )}

      {/* PINNED ANNOUNCEMENT BANNER */}
      {pinnedMessage && (
        <View style={styles.pinnedBanner}>
          <Ionicons name="pin" size={18} color="#FF9800" style={{ marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pinnedBannerTitle}>Pesan Disematkan oleh {pinnedMessage.sender_name}</Text>
            <Text style={styles.pinnedBannerText} numberOfLines={1}>
              {pinnedMessage.content || 'Foto / Lampiran'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => handlePinMessage(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* CHAT AREA */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#1A1A1A" /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={displayMessages}
          keyExtractor={i => i.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* MENTION SUGGESTIONS */}
      {mentionQuery !== null && filteredMembers.length > 0 && (
        <View style={styles.mentionListContainer}>
          <ScrollView keyboardShouldPersistTaps="always">
            {filteredMembers.map(m => (
              <TouchableOpacity key={m.id} style={styles.mentionItem} onPress={() => handleSelectMention(m)}>
                <View style={styles.smAvatar}>
                  <Text style={styles.smAvatarText}>{(m.nama_lengkap || m.username).charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.mentionItemName}>{m.nama_lengkap || m.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* EDIT MODE BAR */}
      {editingMessageId && (
        <View style={styles.editModeBar}>
          <Ionicons name="create-outline" size={18} color="#4CAF50" />
          <Text style={styles.editModeText}>Mengedit Pesan...</Text>
          <TouchableOpacity onPress={() => { setEditingMessageId(null); setInputText(''); }}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      )}

      {/* REPLY PREVIEW BAR */}
      {replyingToMessage && !editingMessageId ? (
        <View style={styles.replyPreviewBox}>
          <View style={styles.replyPreviewContent}>
            <Text style={styles.replyPreviewName}>Membalas {replyingToMessage.nama_lengkap || replyingToMessage.username}</Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              {replyingToMessage.content ? (replyingToMessage.content.startsWith('[STICKER:') ? 'Stiker' : replyingToMessage.content) : 'Foto / File'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingToMessage(null)} style={styles.replyPreviewCloseBtn}>
            <Ionicons name="close-circle" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* UPLOAD PROGRESS BAR */}
      {uploadStatus.uploading && (
        <View style={styles.uploadProgressBarBox}>
          <View style={styles.uploadProgressInfo}>
            <Ionicons name="cloud-upload" size={18} color="#1A1A1A" />
            <Text style={styles.uploadProgressFileName} numberOfLines={1}>
              Mengunggah: {uploadStatus.fileName}
            </Text>
            <Text style={styles.uploadProgressPercent}>{uploadStatus.percent}%</Text>
          </View>
          <View style={styles.uploadTrack}>
            <View style={[styles.uploadFill, { width: `${uploadStatus.percent}%` }]} />
          </View>
        </View>
      )}

      {/* TYPING INDICATOR BANNER */}
      {Object.keys(typingUsers).length > 0 && (
        <View style={styles.typingIndicatorRow}>
          <Ionicons name="pencil" size={12} color="#2196F3" />
          <Text style={styles.typingIndicatorText}>
            {Object.values(typingUsers).join(', ')} sedang mengetik...
          </Text>
        </View>
      )}

      {/* RECORDING BAR OR INPUT WRAPPER */}
      {isRecording ? (
        <View style={styles.recordBar}>
          <TouchableOpacity onPress={cancelRecording} style={styles.recordCancelBtn}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.recordCancelText}>Batal</Text>
          </TouchableOpacity>
          <Animated.View style={[styles.recordingPulse, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.recordingDot} />
          </Animated.View>
          <Text style={styles.recordTimeText}>{formatDuration(recordingDuration)}</Text>
          <Text style={styles.recordLabel}>Merekam Suara...</Text>
          <TouchableOpacity onPress={stopAndSendRecording} style={styles.recordSendBtn}>
            <Ionicons name="send" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputWrapper}>
          <View style={styles.inputPill}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsAttachMenuVisible(true)}>
              <Ionicons name="add" size={24} color="#666" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Ketik pesan..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={2000}
            />
            <TouchableOpacity style={styles.iconBtn} onPress={() => setIsStickerMenuVisible(true)}>
              <Ionicons name="happy-outline" size={24} color="#666" />
            </TouchableOpacity>
            {inputText.trim().length > 0 ? (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendText}>
                <Ionicons name="send" size={18} color="#FFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.micBtn} onPress={startRecording}>
                <Ionicons name="mic" size={22} color="#1A1A1A" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ─── INFO MODAL WITH 4 FULL TABS ─── */}
      {isInfoModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.infoModal}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Detail & Info Job</Text>
              <TouchableOpacity onPress={() => setIsInfoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            {/* TAB SELECTOR PILLS */}
            <View style={styles.tabPillRow}>
              <TouchableOpacity
                style={[styles.tabPill, infoActiveTab === 'members' && styles.tabPillActive]}
                onPress={() => setInfoActiveTab('members')}
              >
                <Ionicons name="people" size={14} color={infoActiveTab === 'members' ? '#FFF' : '#666'} />
                <Text style={[styles.tabPillText, infoActiveTab === 'members' && styles.tabPillTextActive]}>
                  Anggota ({groupMembers.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, infoActiveTab === 'briefing' && styles.tabPillActive]}
                onPress={() => setInfoActiveTab('briefing')}
              >
                <Ionicons name="document-text" size={14} color={infoActiveTab === 'briefing' ? '#FFF' : '#666'} />
                <Text style={[styles.tabPillText, infoActiveTab === 'briefing' && styles.tabPillTextActive]}>
                  Briefing
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, infoActiveTab === 'checklist' && styles.tabPillActive]}
                onPress={() => setInfoActiveTab('checklist')}
              >
                <Ionicons name="checkbox" size={14} color={infoActiveTab === 'checklist' ? '#FFF' : '#666'} />
                <Text style={[styles.tabPillText, infoActiveTab === 'checklist' && styles.tabPillTextActive]}>
                  Checklist ({checklists.filter(c => c.is_checked).length}/{checklists.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabPill, infoActiveTab === 'media' && styles.tabPillActive]}
                onPress={() => setInfoActiveTab('media')}
              >
                <Ionicons name="images" size={14} color={infoActiveTab === 'media' ? '#FFF' : '#666'} />
                <Text style={[styles.tabPillText, infoActiveTab === 'media' && styles.tabPillTextActive]}>
                  Galeri ({groupMedia.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: ANGGOTA & DIRECT WHATSAPP */}
            {infoActiveTab === 'members' && (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionSubtitle}>Daftar Kontak Anggota Job</Text>
                {loadingMembers ? (
                  <ActivityIndicator size="small" color="#1A1A1A" style={{ marginVertical: 20 }} />
                ) : (
                  <ScrollView style={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
                    {groupMembers.map(m => (
                      <View key={m.id} style={styles.memberRow}>
                        {m.avatar_url ? (
                          <Image source={{ uri: getFileUrl(m.avatar_url) }} style={styles.smAvatar} />
                        ) : (
                          <View style={styles.smAvatar}>
                            <Text style={styles.smAvatarText}>{(m.nama_lengkap || m.username).charAt(0).toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.memberName}>{m.nama_lengkap || m.username}</Text>
                            <View style={styles.onlineDotSmall} />
                          </View>
                          <Text style={styles.memberRole}>[{m.role_name || 'Anggota'}] • {m.email}</Text>
                          {m.no_hp ? <Text style={styles.memberPhoneText}>📞 {m.no_hp}</Text> : null}
                        </View>

                        {/* WA BUTTON */}
                        {m.no_hp ? (
                          <TouchableOpacity
                            style={styles.waDirectBtn}
                            onPress={() => openWhatsApp(m.no_hp)}
                          >
                            <Ionicons name="logo-whatsapp" size={16} color="#FFF" />
                            <Text style={styles.waDirectBtnText}>WA</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* TAB 2: BRIEFING & RUNDOWN */}
            {infoActiveTab === 'briefing' && (
              <ScrollView style={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
                <View style={styles.briefingHeaderRow}>
                  <Text style={styles.sectionSubtitle}>Briefing & Rundown Acara</Text>
                  {user?.id_role === 1 && !isEditingBriefing && (
                    <TouchableOpacity
                      style={styles.editBriefingBtn}
                      onPress={() => setIsEditingBriefing(true)}
                    >
                      <Ionicons name="create-outline" size={14} color="#FFF" />
                      <Text style={styles.editBriefingBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {isEditingBriefing ? (
                  <View style={styles.briefingFormContainer}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.briefingLabel}>Call Time:</Text>
                        <TextInput
                          style={styles.briefingInput}
                          placeholder="14:00"
                          value={briefingForm.call_time}
                          onChangeText={(v) => setBriefingForm({ ...briefingForm, call_time: v })}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.briefingLabel}>Show Time:</Text>
                        <TextInput
                          style={styles.briefingInput}
                          placeholder="19:30"
                          value={briefingForm.show_time}
                          onChangeText={(v) => setBriefingForm({ ...briefingForm, show_time: v })}
                        />
                      </View>
                    </View>

                    <Text style={styles.briefingLabel}>Alamat Panggung / Venue:</Text>
                    <TextInput
                      style={styles.briefingInput}
                      placeholder="Ballroom Lantai 2, Hotel Santika"
                      value={briefingForm.venue_address}
                      onChangeText={(v) => setBriefingForm({ ...briefingForm, venue_address: v })}
                    />

                    <Text style={styles.briefingLabel}>Dresscode Kostum:</Text>
                    <TextInput
                      style={styles.briefingInput}
                      placeholder="Kostum Jawa Hitam / Emas"
                      value={briefingForm.dresscode}
                      onChangeText={(v) => setBriefingForm({ ...briefingForm, dresscode: v })}
                    />

                    <Text style={styles.briefingLabel}>Catatan Rundown / Urutan Acara:</Text>
                    <TextInput
                      style={[styles.briefingInput, { minHeight: 70, textAlignVertical: 'top' }]}
                      placeholder="14:00 GR, 18:00 Makan Malam, 19:30 Pembukaan..."
                      multiline
                      value={briefingForm.rundown_notes}
                      onChangeText={(v) => setBriefingForm({ ...briefingForm, rundown_notes: v })}
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={styles.cancelBriefingBtn}
                        onPress={() => setIsEditingBriefing(false)}
                      >
                        <Text style={styles.cancelBriefingText}>Batal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveBriefingBtn}
                        onPress={handleSaveBriefing}
                      >
                        <Text style={styles.saveBriefingText}>Simpan Briefing</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.briefingCard}>
                    <View style={styles.briefingItemRow}>
                      <Ionicons name="alarm-outline" size={18} color="#D4AF37" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.briefingItemTitle}>Waktu Pelaksanaan</Text>
                        <Text style={styles.briefingItemValue}>
                          Call Time: <Text style={{ fontWeight: 'bold' }}>{groupDetail?.call_time || '-'}</Text> | Show Time: <Text style={{ fontWeight: 'bold' }}>{groupDetail?.show_time || '-'}</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.briefingItemRow}>
                      <Ionicons name="location-outline" size={18} color="#D4AF37" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.briefingItemTitle}>Alamat & Venue</Text>
                        <Text style={styles.briefingItemValue}>{groupDetail?.venue_address || 'Belum diisi oleh admin'}</Text>
                      </View>
                    </View>

                    <View style={styles.briefingItemRow}>
                      <Ionicons name="shirt-outline" size={18} color="#D4AF37" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.briefingItemTitle}>Dresscode Kostum</Text>
                        <Text style={styles.briefingItemValue}>{groupDetail?.dresscode || 'Belum diisi oleh admin'}</Text>
                      </View>
                    </View>

                    <View style={styles.briefingItemRow}>
                      <Ionicons name="reader-outline" size={18} color="#D4AF37" />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.briefingItemTitle}>Catatan Rundown Acara</Text>
                        <Text style={[styles.briefingItemValue, { whiteSpace: 'pre-line' as any }]}>
                          {groupDetail?.rundown_notes || 'Belum ada catatan rundown.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            )}

            {/* TAB 3: CHECKLIST INVENTARIS ALAT & KOSTUM */}
            {infoActiveTab === 'checklist' && (
              <View style={{ flex: 1 }}>
                <View style={styles.briefingHeaderRow}>
                  <Text style={styles.sectionSubtitle}>Inventaris Alat & Kostum</Text>
                  <TouchableOpacity
                    style={styles.editBriefingBtn}
                    onPress={() => setIsAddingItem(!isAddingItem)}
                  >
                    <Ionicons name={isAddingItem ? "close" : "add"} size={14} color="#FFF" />
                    <Text style={styles.editBriefingBtnText}>{isAddingItem ? "Tutup" : "Tambah"}</Text>
                  </TouchableOpacity>
                </View>

                {/* FORM TAMBAH ITEM CHECKLIST */}
                {isAddingItem && (
                  <View style={styles.addChecklistCard}>
                    <Text style={styles.briefingLabel}>Nama Barang / Kostum:</Text>
                    <TextInput
                      style={styles.briefingInput}
                      placeholder="Contoh: Gendang 1 Set, Sampur Merah..."
                      value={newItemName}
                      onChangeText={setNewItemName}
                    />

                    <Text style={styles.briefingLabel}>Kategori:</Text>
                    <View style={styles.categoryChipRow}>
                      {['Alat Musik', 'Kostum & Aksesoris', 'Logistik & Teknis', 'Lainnya'].map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.catChip, newItemCategory === cat && styles.catChipActive]}
                          onPress={() => setNewItemCategory(cat)}
                        >
                          <Text style={[styles.catChipText, newItemCategory === cat && styles.catChipTextActive]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity style={styles.confirmAddBtn} onPress={handleAddChecklistItem}>
                      <Text style={styles.confirmAddBtnText}>Simpan ke Checklist</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* FILTER KATEGORI */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 36, marginVertical: 6 }}>
                  {['Semua', 'Alat Musik', 'Kostum & Aksesoris', 'Logistik & Teknis', 'Lainnya'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.filterChip, selectedChecklistCategory === cat && styles.filterChipActive]}
                      onPress={() => setSelectedChecklistCategory(cat)}
                    >
                      <Text style={[styles.filterChipText, selectedChecklistCategory === cat && styles.filterChipTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* LIST ITEM CHECKLIST INTERAKTIF */}
                <ScrollView style={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
                  {filteredChecklists.length === 0 ? (
                    <Text style={styles.emptyChecklistText}>Belum ada barang di kategori ini.</Text>
                  ) : (
                    filteredChecklists.map(item => (
                      <View key={item.id} style={styles.checklistItemRow}>
                        <TouchableOpacity
                          style={styles.checkboxTouch}
                          onPress={() => handleToggleChecklist(item.id)}
                        >
                          <Ionicons
                            name={item.is_checked ? "checkbox" : "square-outline"}
                            size={22}
                            color={item.is_checked ? "#4CAF50" : "#666"}
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={[styles.checklistItemName, item.is_checked && styles.checkedItemText]}>
                              {item.item_name}
                            </Text>
                            <Text style={styles.checklistItemMeta}>
                              [{item.category}] {item.is_checked && item.checker_name ? `• Siap by ${item.checker_name}` : ''}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        {user?.id_role === 1 && (
                          <TouchableOpacity onPress={() => handleDeleteChecklistItem(item.id)} style={{ padding: 4 }}>
                            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            )}

            {/* TAB 4: GALERI MEDIA & DOKUMEN */}
            {infoActiveTab === 'media' && (
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionSubtitle}>Semua Media & Dokumen di Grup</Text>
                {loadingMedia ? (
                  <ActivityIndicator size="small" color="#1A1A1A" style={{ marginVertical: 20 }} />
                ) : groupMedia.length === 0 ? (
                  <Text style={styles.emptyChecklistText}>Belum ada media yang dikirim di grup ini.</Text>
                ) : (
                  <ScrollView style={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
                    <View style={styles.mediaGrid}>
                      {groupMedia.map(m => {
                        const isImg = isImageFile(m.attachment_url);
                        const isAud = isAudioFile(m.attachment_url);

                        if (isImg) {
                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={styles.mediaGridItem}
                              onPress={() => setFullScreenImage(`${BASE_URL}${m.attachment_url}`)}
                            >
                              <RemoteImage uri={`${BASE_URL}${m.attachment_url}`} style={styles.mediaThumbnail} />
                            </TouchableOpacity>
                          );
                        }

                        if (isAud) {
                          return (
                            <TouchableOpacity
                              key={m.id}
                              style={styles.audioDocRow}
                              onPress={() => handlePlayAudio(m.id, m.attachment_url)}
                            >
                              <Ionicons name="mic" size={20} color="#1A1A1A" />
                              <Text style={styles.audioDocText} numberOfLines={1}>
                                Voice Note dari {m.sender_name}
                              </Text>
                              <Ionicons name="play-circle" size={20} color="#2196F3" />
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={styles.audioDocRow}
                            onPress={() => Linking.openURL(`${BASE_URL}${m.attachment_url}`)}
                          >
                            <Ionicons name="document-text" size={20} color="#9C27B0" />
                            <Text style={styles.audioDocText} numberOfLines={1}>
                              Dokumen ({m.sender_name})
                            </Text>
                            <Ionicons name="download-outline" size={18} color="#666" />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setIsInfoModalVisible(false)}>
              <Text style={styles.closeInfoBtnText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FULL SCREEN IMAGE VIEWER */}
      {fullScreenImage ? (
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity style={styles.imageViewerCloseBtn} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          <RemoteImage uri={fullScreenImage} style={styles.imageViewerImage} />
        </View>
      ) : null}

      {/* MESSAGE OPTIONS MODAL */}
      {isMsgOptionsVisible && selectedMessage && (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsMsgOptionsVisible(false)} />
          <View style={styles.msgOptionsSheet}>
            <View style={styles.emojiReactionRow}>
              {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji, idx) => (
                <TouchableOpacity key={idx} style={styles.emojiBtn} onPress={() => handleReactMessage(selectedMessage, emoji)}>
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.optionsDivider} />

            <TouchableOpacity style={styles.optionRow} onPress={() => { setReplyingToMessage(selectedMessage); setIsMsgOptionsVisible(false); }}>
              <Ionicons name="arrow-undo-outline" size={20} color="#2196F3" />
              <Text style={styles.optionRowText}>Balas Pesan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionRow} onPress={() => handlePinMessage(selectedMessage)}>
              <Ionicons name="pin-outline" size={20} color="#FF9800" />
              <Text style={styles.optionRowText}>Sematkan Pesan (Pin)</Text>
            </TouchableOpacity>

            {selectedMessage.sender_id === user?.id && !selectedMessage.attachment_url && (
              <TouchableOpacity style={styles.optionRow} onPress={() => { setInputText(selectedMessage.content); setEditingMessageId(selectedMessage.id); setIsMsgOptionsVisible(false); }}>
                <Ionicons name="create-outline" size={20} color="#4CAF50" />
                <Text style={styles.optionRowText}>Edit Pesan</Text>
              </TouchableOpacity>
            )}

            {selectedMessage.sender_id === user?.id && (
              <TouchableOpacity style={styles.optionRow} onPress={() => handleDeleteMessage(selectedMessage)}>
                <Ionicons name="trash-outline" size={20} color="#E53935" />
                <Text style={[styles.optionRowText, { color: '#E53935' }]}>Hapus untuk Semua Orang</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

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

      {/* STICKER MENU */}
      {isStickerMenuVisible ? (
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsStickerMenuVisible(false)} />
          <View style={styles.attachMenu}>
            <Text style={styles.attachMenuTitle}>Pilih Stiker</Text>
            <View style={styles.stickerGrid}>
              {STICKERS.map((url, idx) => (
                <TouchableOpacity key={idx} style={styles.stickerOption} onPress={() => handleSendSticker(url)}>
                  <RemoteImage uri={url} style={styles.stickerPreview} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : null}

      {/* MULTI UPLOAD PREVIEW MODAL */}
      {isPreviewModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.infoModal}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Kirim {selectedUploads.length} File?</Text>
              <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)} style={styles.replyPreviewCloseBtn}>
                <Ionicons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>

            <ScrollView horizontal style={{ maxHeight: 200, marginBottom: 16 }}>
              {selectedUploads.map((file, idx) => (
                <View key={idx} style={{ marginRight: 10 }}>
                  <Image source={{ uri: file.uri }} style={{ width: 120, height: 120, borderRadius: 8, backgroundColor: '#F1EBE1' }} />
                  <Text style={{ fontSize: 10, color: '#666', marginTop: 4, maxWidth: 120 }} numberOfLines={1}>{file.name || 'foto.jpg'}</Text>
                </View>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)} style={[styles.closeInfoBtn, { backgroundColor: '#F1EBE1', flex: 1 }]}>
                <Text style={[styles.closeInfoBtnText, { color: '#1A1A1A' }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmMultiUpload}
                style={[styles.closeInfoBtn, { flex: 1 }]}
                disabled={isUploadingMulti}
              >
                {isUploadingMulti ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.closeInfoBtnText}>Kirim ({selectedUploads.length})</Text>
                )}
              </TouchableOpacity>
            </View>
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
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A1A1A' },
  headerSubtitle: { fontSize: 11, color: '#888' },
  onlineBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50', marginLeft: 6 },
  onlineDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50', marginLeft: 6 },

  // In-Chat Search
  inChatSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8',
  },
  inChatSearchInput: { flex: 1, fontSize: 13, color: '#1A1A1A', padding: 0 },
  searchCountBadge: { fontSize: 11, color: '#2196F3', fontWeight: 'bold', marginLeft: 8 },

  pinnedBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF3E0', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#FFE0B2' },
  pinnedBannerTitle: { fontSize: 11, fontWeight: 'bold', color: '#E65100' },
  pinnedBannerText: { fontSize: 13, color: '#333', marginTop: 2 },
  chatContainer: { padding: 16, paddingBottom: 32 },
  messageRow: { marginBottom: 12, maxWidth: '85%' },
  messageRowMe: { alignSelf: 'flex-end' },
  messageRowOther: { alignSelf: 'flex-start' },
  senderName: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4, marginLeft: 4 },
  messageBubble: { padding: 12, borderRadius: 18, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
  messageBubbleMe: { backgroundColor: '#1A1A1A', borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#FFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E0D8C8' },
  messageStickerBubble: { padding: 4, elevation: 0, shadowOpacity: 0 },
  stickerImage: { width: 120, height: 120 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTextMe: { color: '#F9F6F0' },
  messageTextOther: { color: '#1A1A1A' },
  mentionText: { fontWeight: 'bold' },
  mentionTextMe: { color: '#64B5F6' },
  mentionTextOther: { color: '#2196F3' },
  timeRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginTop: 4 },
  editedTag: { fontSize: 10, fontStyle: 'italic' },
  messageTime: { fontSize: 10 },
  messageTimeMe: { color: 'rgba(249,246,240,0.5)' },
  messageTimeOther: { color: '#999' },
  reactionsRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  reactionPill: { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  reactionEmojiText: { fontSize: 12 },
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
  vnProgressTrack: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  vnProgressFill: { height: '100%', borderRadius: 2 },
  vnWaveform: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  vnWaveBar: { width: 3, borderRadius: 2 },

  // Typing Row
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
  },
  typingIndicatorText: { fontSize: 11, color: '#2196F3', fontStyle: 'italic' },

  inputWrapper: { padding: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 12, backgroundColor: '#F1EBE1' },
  inputPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 28, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#E0D8C8', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  iconBtn: { padding: 6 },
  textInput: { flex: 1, fontSize: 15, color: '#1A1A1A', paddingHorizontal: 8, paddingVertical: 8, maxHeight: 100 },
  micBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F1EBE1', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginLeft: 4 },

  // Recording Bar
  recordBar: { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, paddingBottom: Platform.OS === 'ios' ? 30 : 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0D8C8' },
  recordCancelBtn: { flexDirection: 'row', alignItems: 'center', padding: 6, gap: 4 },
  recordCancelText: { color: '#FF3B30', fontSize: 12, fontWeight: 'bold' },
  recordingPulse: { marginLeft: 10 },
  recordingDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FF3B30' },
  recordTimeText: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 10 },
  recordLabel: { fontSize: 12, color: '#888', marginLeft: 8, flex: 1 },
  recordSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },

  editModeBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  editModeText: { flex: 1, fontSize: 12, fontWeight: 'bold', color: '#2E7D32' },
  replyPreviewBox: { flexDirection: 'row', backgroundColor: '#F9F6F0', padding: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomWidth: 1, borderBottomColor: '#E0D8C8', alignItems: 'center' },
  replyPreviewContent: { flex: 1, borderLeftWidth: 4, borderLeftColor: '#2196F3', paddingLeft: 10 },
  replyPreviewName: { fontSize: 12, fontWeight: 'bold', color: '#2196F3', marginBottom: 2 },
  replyPreviewText: { fontSize: 13, color: '#666' },
  replyPreviewCloseBtn: { padding: 4 },
  replyQuoteBox: { padding: 8, borderRadius: 8, marginBottom: 6, borderLeftWidth: 4 },
  replyQuoteBoxMe: { backgroundColor: 'rgba(255,255,255,0.1)', borderLeftColor: '#64B5F6' },
  replyQuoteBoxOther: { backgroundColor: 'rgba(0,0,0,0.05)', borderLeftColor: '#2196F3' },
  replyQuoteName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  replyQuoteNameMe: { color: '#64B5F6' },
  replyQuoteNameOther: { color: '#2196F3' },
  replyQuoteText: { fontSize: 12 },
  replyQuoteTextMe: { color: 'rgba(255,255,255,0.8)' },
  replyQuoteTextOther: { color: '#666' },

  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, justifyContent: 'center', alignItems: 'center', padding: 16 },
  msgOptionsSheet: { width: '100%', maxWidth: 360, backgroundColor: '#FFF', borderRadius: 20, padding: 16 },
  emojiReactionRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
  emojiBtn: { padding: 6, borderRadius: 12, backgroundColor: '#F9F6F0' },
  optionsDivider: { height: 1, backgroundColor: '#E0D8C8', marginVertical: 10 },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, gap: 12 },
  optionRowText: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },

  // 4-Tab Info Modal
  infoModal: { width: '100%', maxWidth: 480, height: '85%', backgroundColor: '#FFF', borderRadius: 24, padding: 18, display: 'flex', flexDirection: 'column' },
  infoModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },

  tabPillRow: { flexDirection: 'row', backgroundColor: '#F1EBE1', borderRadius: 12, padding: 3, marginBottom: 12, gap: 4 },
  tabPill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 4 },
  tabPillActive: { backgroundColor: '#1A1A1A' },
  tabPillText: { fontSize: 11, fontWeight: '600', color: '#666' },
  tabPillTextActive: { color: '#FFF' },

  sectionSubtitle: { fontSize: 13, fontWeight: 'bold', color: '#888', marginBottom: 8 },
  modalScrollArea: { flex: 1, marginBottom: 12 },

  // Members Tab
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F9F6F0' },
  smAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  smAvatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  memberName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A' },
  memberRole: { fontSize: 11, color: '#888', marginTop: 1 },
  memberPhoneText: { fontSize: 11, color: '#2E7D32', fontWeight: '600', marginTop: 2 },
  waDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  waDirectBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },

  // Briefing Tab
  briefingHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  editBriefingBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  editBriefingBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  briefingCard: { backgroundColor: '#F9F6F0', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E0D8C8' },
  briefingItemRow: { flexDirection: 'row', marginBottom: 12 },
  briefingItemTitle: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  briefingItemValue: { fontSize: 13, color: '#1A1A1A', marginTop: 2, lineHeight: 18 },
  briefingFormContainer: { backgroundColor: '#F9F6F0', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E0D8C8' },
  briefingLabel: { fontSize: 11, fontWeight: 'bold', color: '#444', marginTop: 6, marginBottom: 3 },
  briefingInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8', borderRadius: 8, padding: 8, fontSize: 13, color: '#1A1A1A' },
  cancelBriefingBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#E0D8C8' },
  cancelBriefingText: { fontSize: 12, color: '#444', fontWeight: 'bold' },
  saveBriefingBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1A1A1A' },
  saveBriefingText: { fontSize: 12, color: '#FFF', fontWeight: 'bold' },

  // Checklist Tab
  addChecklistCard: { backgroundColor: '#F9F6F0', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E0D8C8' },
  categoryChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 6 },
  catChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0D8C8' },
  catChipActive: { backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' },
  catChipText: { fontSize: 11, color: '#444' },
  catChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  confirmAddBtn: { backgroundColor: '#1A1A1A', padding: 8, borderRadius: 8, alignItems: 'center', marginTop: 6 },
  confirmAddBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F1EBE1', marginRight: 6, height: 28 },
  filterChipActive: { backgroundColor: '#1A1A1A' },
  filterChipText: { fontSize: 11, color: '#666', fontWeight: '500' },
  filterChipTextActive: { color: '#FFF', fontWeight: 'bold' },
  checklistItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1EBE1' },
  checkboxTouch: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  checklistItemName: { fontSize: 13, fontWeight: 'bold', color: '#1A1A1A' },
  checkedItemText: { textDecorationLine: 'line-through', color: '#888' },
  checklistItemMeta: { fontSize: 10, color: '#888', marginTop: 1 },
  emptyChecklistText: { textAlign: 'center', color: '#888', fontStyle: 'italic', marginVertical: 20, fontSize: 12 },

  // Media Tab
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mediaGridItem: { width: '31%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F1EBE1' },
  mediaThumbnail: { width: '100%', height: '100%' },
  audioDocRow: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#F9F6F0', borderRadius: 8, marginBottom: 6, gap: 10, borderWidth: 1, borderColor: '#E0D8C8' },
  audioDocText: { flex: 1, fontSize: 12, color: '#1A1A1A', fontWeight: '600' },

  closeInfoBtn: { backgroundColor: '#1A1A1A', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  closeInfoBtnText: { color: '#FFF', fontWeight: 'bold' },

  attachMenu: { width: '100%', maxWidth: 400, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  attachMenuTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20, textAlign: 'center' },
  attachGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', gap: 16 },
  attachOption: { alignItems: 'center', width: '30%', marginBottom: 12 },
  attachIconBg: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  attachLabel: { fontSize: 13, fontWeight: '600', color: '#333' },
  stickerGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  stickerOption: { width: '22%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', padding: 8, backgroundColor: '#F9F6F0', borderRadius: 16 },
  stickerPreview: { width: '100%', height: '100%' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  loadingText: { marginLeft: 8, fontSize: 13, color: '#666' },
  imageViewerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 999, justifyContent: 'center', alignItems: 'center' },
  imageViewerCloseBtn: { position: 'absolute', top: 40, right: 20, zIndex: 1000, padding: 10 },
  imageViewerImage: { width: '90%', height: '80%' },
  mentionListContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 80 : 70, left: 10, right: 10, maxHeight: 150, backgroundColor: '#FFF', borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4, zIndex: 50, borderWidth: 1, borderColor: '#E0D8C8' },
  mentionItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F1EBE1' },
  mentionItemName: { fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginLeft: 10 },
  uploadProgressBarBox: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0D8C8',
    marginHorizontal: 10,
    marginBottom: -4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadProgressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  uploadProgressFileName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  uploadProgressPercent: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  uploadTrack: {
    height: 5,
    backgroundColor: '#F1EBE1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  uploadFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
});
