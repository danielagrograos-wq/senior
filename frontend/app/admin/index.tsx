import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';

interface DashboardData {
  users: { total: number; clients: number; caregivers: number };
  caregivers: { verified: number; pending_verification: number };
  bookings: { total: number; pending: number; confirmed: number; completed: number; cancelled: number };
  financial: { total_revenue_cents: number; platform_fees_cents: number; caregiver_earnings_cents: number };
  recent_bookings: any[];
  recent_users: any[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Wait for user to load
      if (!user) return;
      
      if (user.role !== 'admin') {
        Alert.alert('Acesso negado', 'Apenas administradores podem acessar esta área.');
        router.back();
        return;
      }
      fetchDashboard();
    }, [user])
  );

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setData(response.data);
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response?.status === 403) {
        Alert.alert('Acesso negado', 'Você não tem permissão de administrador.');
        router.back();
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const formatCurrency = (cents: number) => `R$ ${(cents / 100).toFixed(2)}`;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel Admin</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchDashboard(); }} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.primary[500] }]}>
            <Ionicons name="people" size={28} color={colors.white} />
            <Text style={styles.statNumber}>{data?.users.total || 0}</Text>
            <Text style={styles.statLabel}>Total Usuários</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.success }]}>
            <Ionicons name="checkmark-circle" size={28} color={colors.white} />
            <Text style={styles.statNumber}>{data?.caregivers.verified || 0}</Text>
            <Text style={styles.statLabel}>Verificados</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.warning }]}>
            <Ionicons name="time" size={28} color={colors.white} />
            <Text style={styles.statNumber}>{data?.caregivers.pending_verification || 0}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.secondary[600] }]}>
            <Ionicons name="calendar" size={28} color={colors.white} />
            <Text style={styles.statNumber}>{data?.bookings.total || 0}</Text>
            <Text style={styles.statLabel}>Agendamentos</Text>
          </View>
        </View>

        {/* Financial Card */}
        <View style={styles.financialCard}>
          <Text style={styles.sectionTitle}>💰 Financeiro</Text>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Receita Total</Text>
            <Text style={styles.financialValue}>{formatCurrency(data?.financial.total_revenue_cents || 0)}</Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Taxas da Plataforma</Text>
            <Text style={[styles.financialValue, { color: colors.success }]}>
              {formatCurrency(data?.financial.platform_fees_cents || 0)}
            </Text>
          </View>
          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Repasses aos Cuidadores</Text>
            <Text style={styles.financialValue}>{formatCurrency(data?.financial.caregiver_earnings_cents || 0)}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/users')}>
            <Ionicons name="people-outline" size={32} color={colors.primary[600]} />
            <Text style={styles.actionText}>Usuários</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/pending')}>
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.warning} />
            <Text style={styles.actionText}>Verificações</Text>
            {data?.caregivers.pending_verification > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{data.caregivers.pending_verification}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/bookings')}>
            <Ionicons name="calendar-outline" size={32} color={colors.secondary[600]} />
            <Text style={styles.actionText}>Agendamentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/reports')}>
            <Ionicons name="bar-chart-outline" size={32} color={colors.success} />
            <Text style={styles.actionText}>Relatórios</Text>
          </TouchableOpacity>
        </View>

        {/* Bookings by Status */}
        <Text style={styles.sectionTitle}>📊 Status dos Agendamentos</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.statusLabel}>Pendentes</Text>
            <Text style={styles.statusValue}>{data?.bookings.pending || 0}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.info }]} />
            <Text style={styles.statusLabel}>Confirmados</Text>
            <Text style={styles.statusValue}>{data?.bookings.confirmed || 0}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
            <Text style={styles.statusLabel}>Concluídos</Text>
            <Text style={styles.statusValue}>{data?.bookings.completed || 0}</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: colors.error }]} />
            <Text style={styles.statusLabel}>Cancelados</Text>
            <Text style={styles.statusValue}>{data?.bookings.cancelled || 0}</Text>
          </View>
        </View>

        {/* Recent Users */}
        <Text style={styles.sectionTitle}>👥 Usuários Recentes</Text>
        {data?.recent_users.map((u: any) => (
          <View key={u.id} style={styles.userCard}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{u.name}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
            </View>
            <View style={[styles.roleBadge, u.role === 'caregiver' ? styles.caregiverBadge : styles.clientBadge]}>
              <Text style={styles.roleText}>{u.role === 'caregiver' ? 'Cuidador' : 'Cliente'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: colors.white, marginTop: 8 },
  statLabel: { fontSize: 12, color: colors.white + 'CC', marginTop: 4 },
  financialCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  financialRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  financialLabel: { fontSize: 14, color: colors.textSecondary },
  financialValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  actionCard: { width: '47%', backgroundColor: colors.white, padding: 20, borderRadius: 12, alignItems: 'center', position: 'relative' },
  actionText: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginTop: 8 },
  badge: { position: 'absolute', top: 8, right: 8, backgroundColor: colors.error, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: 'bold' },
  statusCard: { backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 20 },
  statusRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  statusDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  statusValue: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 12, borderRadius: 12, marginBottom: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.secondary[100], justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  userEmail: { fontSize: 12, color: colors.textMuted },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  caregiverBadge: { backgroundColor: colors.primary[50] },
  clientBadge: { backgroundColor: colors.secondary[100] },
  roleText: { fontSize: 11, fontWeight: '600', color: colors.primary[700] },
});
