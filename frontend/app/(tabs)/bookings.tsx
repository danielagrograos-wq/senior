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
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';
import { colors } from '../../src/theme/colors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Booking {
  id: string;
  caregiver_id: string;
  caregiver_name: string;
  client_id: string;
  client_name: string;
  elder_name: string;
  start_datetime: string;
  end_datetime: string;
  status: string;
  service_type: string;
  price_cents: number;
  platform_fee_cents: number;
  total_cents: number;
  notes: string | null;
  paid: boolean;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: colors.warning, bg: colors.warning + '20' },
  confirmed: { label: 'Confirmado', color: colors.info, bg: colors.info + '20' },
  in_progress: { label: 'Em andamento', color: colors.primary[600], bg: colors.primary[100] },
  completed: { label: 'Concluído', color: colors.success, bg: colors.success + '20' },
  cancelled: { label: 'Cancelado', color: colors.error, bg: colors.error + '20' },
};

export default function BookingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendentes' },
    { id: 'confirmed', label: 'Confirmados' },
    { id: 'in_progress', label: 'Em andamento' },
    { id: 'completed', label: 'Concluídos' },
  ];

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) =>
    selectedFilter === 'all' ? true : b.status === selectedFilter
  );

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await api.put(`/bookings/${bookingId}/status?status=${newStatus}`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => {
    const startDate = new Date(item.start_datetime);
    const endDate = new Date(item.end_datetime);
    const status = statusConfig[item.status] || statusConfig.pending;
    const isCaregiver = user?.role === 'caregiver';

    return (
      <TouchableOpacity
        style={styles.bookingCard}
        onPress={() => router.push(`/booking/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Text style={styles.dateDay}>
              {format(startDate, 'dd', { locale: ptBR })}
            </Text>
            <Text style={styles.dateMonth}>
              {format(startDate, 'MMM', { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>
              {isCaregiver ? item.elder_name : item.caregiver_name}
            </Text>
            <Text style={styles.cardSubtitle}>
              {isCaregiver ? `Cliente: ${item.client_name}` : `Idoso: ${item.elder_name}`}
            </Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.timeText}>
                {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>
              R$ {(item.total_cents / 100).toFixed(2)}
            </Text>
          </View>

          {/* Action buttons based on status and role */}
          {isCaregiver && item.status === 'pending' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleUpdateStatus(item.id, 'confirmed')}
              >
                <Text style={styles.acceptButtonText}>Aceitar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleUpdateStatus(item.id, 'cancelled')}
              >
                <Text style={styles.rejectButtonText}>Recusar</Text>
              </TouchableOpacity>
            </View>
          )}

          {isCaregiver && item.status === 'confirmed' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={() => handleUpdateStatus(item.id, 'in_progress')}
            >
              <Text style={styles.startButtonText}>Iniciar</Text>
            </TouchableOpacity>
          )}

          {isCaregiver && item.status === 'in_progress' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={() => handleUpdateStatus(item.id, 'completed')}
            >
              <Text style={styles.completeButtonText}>Finalizar</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agendamentos</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Bookings List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingCard}
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
              <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum agendamento</Text>
              <Text style={styles.emptySubtitle}>
                {user?.role === 'client'
                  ? 'Encontre um cuidador e faça sua primeira reserva'
                  : 'Aguarde solicitações de clientes'}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dateContainer: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 56,
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  dateMonth: {
    fontSize: 12,
    color: colors.primary[100],
    textTransform: 'uppercase',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  timeText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceInfo: {},
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  acceptButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: colors.error + '20',
  },
  rejectButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: colors.info,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  completeButtonText: {
    color: colors.white,
    fontWeight: '600',
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
