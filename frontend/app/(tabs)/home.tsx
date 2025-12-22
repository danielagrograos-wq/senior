import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';
import { colors } from '../../src/theme/colors';

interface Caregiver {
  id: string;
  user_name: string;
  bio: string;
  price_hour: number;
  city: string;
  neighborhood: string;
  experience_years: number;
  specializations: string[];
  verified: boolean;
  rating: number;
  total_reviews: number;
  photo: string | null;
  available: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const cities = [
    { id: '', name: 'Todas' },
    { id: 'Campo Grande', name: 'Campo Grande' },
    { id: 'São Paulo', name: 'São Paulo' },
    { id: 'Curitiba', name: 'Curitiba' },
    { id: 'Fortaleza', name: 'Fortaleza' },
  ];

  useEffect(() => {
    fetchCaregivers();
  }, [selectedCity]);

  const fetchCaregivers = async () => {
    try {
      const params: any = { available_only: true };
      if (selectedCity) params.city = selectedCity;
      
      const response = await api.get('/caregivers', { params });
      setCaregivers(response.data);
    } catch (error) {
      console.error('Error fetching caregivers:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchCaregivers();
  };

  const filteredCaregivers = caregivers.filter((c) =>
    c.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.specializations.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderCaregiverCard = ({ item }: { item: Caregiver }) => (
    <TouchableOpacity
      style={styles.caregiverCard}
      onPress={() => router.push(`/caregiver/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={32} color={colors.textMuted} />
            </View>
          )}
          {item.available && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.caregiverName}>{item.user_name}</Text>
            {item.verified && (
              <Ionicons name="checkmark-circle" size={18} color={colors.primary[500]} />
            )}
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {item.neighborhood}, {item.city}
            </Text>
          </View>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingText}>
              {item.rating.toFixed(1)} ({item.total_reviews} avaliações)
            </Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>A partir de</Text>
          <Text style={styles.priceValue}>R$ {item.price_hour.toFixed(0)}</Text>
          <Text style={styles.priceUnit}>/hora</Text>
        </View>
      </View>

      <Text style={styles.bio} numberOfLines={2}>
        {item.bio}
      </Text>

      {item.specializations.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.specializations.slice(0, 3).map((spec, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{spec}</Text>
            </View>
          ))}
          {item.specializations.length > 3 && (
            <View style={[styles.tag, styles.tagMore]}>
              <Text style={styles.tagText}>+{item.specializations.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.experienceRow}>
        <Ionicons name="briefcase" size={14} color={colors.textSecondary} />
        <Text style={styles.experienceText}>
          {item.experience_years} {item.experience_years === 1 ? 'ano' : 'anos'} de experiência
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (user?.role === 'caregiver') {
    return <CaregiverDashboard />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Encontre o cuidador ideal</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, bairro ou especialidade..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* City Filter */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={cities}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCity === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCity(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCity === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Caregivers List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={filteredCaregivers}
          keyExtractor={(item) => item.id}
          renderItem={renderCaregiverCard}
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
              <Ionicons name="search" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum cuidador encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Tente ajustar os filtros ou buscar em outra cidade
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// Caregiver Dashboard Component
function CaregiverDashboard() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    pendingBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/bookings');
      const bookings = response.data;
      setStats({
        pendingBookings: bookings.filter((b: any) => b.status === 'pending').length,
        activeBookings: bookings.filter((b: any) => b.status === 'in_progress').length,
        completedBookings: bookings.filter((b: any) => b.status === 'completed').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}!</Text>
          <Text style={styles.subtitle}>Painel do Cuidador</Text>
        </View>
      </View>

      {/* Verification Status */}
      {!profile?.verified && (
        <View style={styles.verificationBanner}>
          <Ionicons name="alert-circle" size={24} color={colors.warning} />
          <View style={styles.verificationTextContainer}>
            <Text style={styles.verificationTitle}>Perfil não verificado</Text>
            <Text style={styles.verificationSubtitle}>
              Complete seu perfil e envie documentos para verificação
            </Text>
          </View>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.primary[50] }]}>
          <Text style={[styles.statNumber, { color: colors.primary[600] }]}>
            {stats.pendingBookings}
          </Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.info + '20' }]}>
          <Text style={[styles.statNumber, { color: colors.info }]}>
            {stats.activeBookings}
          </Text>
          <Text style={styles.statLabel}>Em andamento</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success + '20' }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>
            {stats.completedBookings}
          </Text>
          <Text style={styles.statLabel}>Concluídos</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Ações Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary[100] }]}>
              <Ionicons name="person" size={24} color={colors.primary[600]} />
            </View>
            <Text style={styles.quickActionText}>Editar Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.info + '30' }]}>
              <Ionicons name="document-text" size={24} color={colors.info} />
            </View>
            <Text style={styles.quickActionText}>Documentos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickActionCard}>
            <View style={[styles.quickActionIcon, { backgroundColor: colors.success + '30' }]}>
              <Ionicons name="camera" size={24} color={colors.success} />
            </View>
            <Text style={styles.quickActionText}>Verificação Facial</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warning + '30' }]}>
              <Ionicons name="calendar" size={24} color={colors.warning} />
            </View>
            <Text style={styles.quickActionText}>Agendamentos</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  filterContainer: {
    paddingBottom: 8,
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
  caregiverCard: {
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
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caregiverName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagMore: {
    backgroundColor: colors.secondary[100],
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: '500',
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  experienceText: {
    fontSize: 13,
    color: colors.textSecondary,
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
  },
  // Caregiver Dashboard Styles
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  verificationTextContainer: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  verificationSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  quickActionsContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
