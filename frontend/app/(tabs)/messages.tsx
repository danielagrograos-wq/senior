import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatRoom {
  id: string;
  participants: string[];
  participant_names: Record<string, string>;
  booking_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [])
  );

  const fetchRooms = async () => {
    try {
      const response = await api.get('/chat/rooms');
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRooms();
  };

  const getOtherParticipantName = (room: ChatRoom) => {
    const otherId = room.participants.find(id => id !== user?.id);
    return otherId ? room.participant_names[otherId] : 'Usuário';
  };

  const renderRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={styles.roomCard}
      onPress={() => router.push(`/chat/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.textMuted} />
        </View>
        {item.unread_count > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unread_count > 9 ? '9+' : item.unread_count}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{getOtherParticipantName(item)}</Text>
          {item.last_message_at && (
            <Text style={styles.roomTime}>
              {formatDistanceToNow(new Date(item.last_message_at), {
                addSuffix: false,
                locale: ptBR,
              })}
            </Text>
          )}
        </View>
        {item.last_message && (
          <Text style={[styles.lastMessage, item.unread_count > 0 && styles.unreadMessage]} numberOfLines={1}>
            {item.last_message}
          </Text>
        )}
        {item.booking_id && (
          <View style={styles.bookingBadge}>
            <Ionicons name="calendar" size={12} color={colors.primary[600]} />
            <Text style={styles.bookingText}>Vinculado a agendamento</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={renderRoom}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[colors.primary[500]]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={64} color={colors.primary[300]} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
              <Text style={styles.emptySubtitle}>
                Suas conversas com cuidadores aparecerão aqui após fazer uma reserva
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  unreadText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  roomInfo: {
    flex: 1,
    marginLeft: 14,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  roomTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  unreadMessage: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  bookingText: {
    fontSize: 11,
    color: colors.primary[600],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
