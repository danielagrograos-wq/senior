import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  read: boolean;
  data?: any;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      refreshUser();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      refreshUser();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_request':
        return { icon: 'calendar', color: colors.info };
      case 'booking_confirmed':
        return { icon: 'checkmark-circle', color: colors.success };
      case 'booking_completed':
        return { icon: 'checkmark-done', color: colors.success };
      case 'care_log_check_in':
        return { icon: 'log-in', color: colors.primary[500] };
      case 'care_log_check_out':
        return { icon: 'log-out', color: colors.warning };
      case 'care_log_medication':
        return { icon: 'medical', color: colors.info };
      case 'care_log_meal':
        return { icon: 'restaurant', color: colors.success };
      case 'care_log_vital_signs':
        return { icon: 'pulse', color: colors.warning };
      case 'emergency':
        return { icon: 'warning', color: colors.error };
      case 'chat_message':
        return { icon: 'chatbubble', color: colors.primary[500] };
      case 'review':
        return { icon: 'star', color: colors.warning };
      default:
        return { icon: 'notifications', color: colors.textMuted };
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Navigate based on type
    if (notification.data?.booking_id) {
      router.push(`/booking/${notification.data.booking_id}`);
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const iconInfo = getNotificationIcon(item.notification_type);
    const isEmergency = item.notification_type === 'emergency';
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard,
          isEmergency && styles.emergencyCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconInfo.color + '20' }]}>
          <Ionicons name={iconInfo.icon as any} size={24} color={iconInfo.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, isEmergency && styles.emergencyTitle]}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
          <Text style={styles.time}>
            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
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
              <Ionicons name="notifications-off-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptySubtitle}>Você será notificado sobre atualizações importantes</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 8,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    color: colors.primary[600],
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  unreadCard: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  emergencyCard: {
    backgroundColor: colors.error + '10',
    borderWidth: 1,
    borderColor: colors.error,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emergencyTitle: {
    color: colors.error,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
