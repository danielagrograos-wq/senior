import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, page]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      let url = `/admin/users?page=${page}&limit=20`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await api.get(url);
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => router.push(`/admin/user/${item.id}`)}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color={colors.textMuted} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, item.role === 'caregiver' ? styles.caregiverRole : item.role === 'admin' ? styles.adminRole : styles.clientRole]}>
            <Text style={styles.roleText}>
              {item.role === 'caregiver' ? 'Cuidador' : item.role === 'admin' ? 'Admin' : 'Cliente'}
            </Text>
          </View>
          {item.verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={styles.verifiedText}>Verificado</Text>
            </View>
          )}
          {item.suspended && (
            <View style={styles.suspendedBadge}>
              <Ionicons name="ban" size={14} color={colors.error} />
              <Text style={styles.suspendedText}>Suspenso</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Usuários</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchText}
            placeholder="Buscar por nome ou email..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {[null, 'client', 'caregiver', 'admin'].map((role) => (
          <TouchableOpacity
            key={role || 'all'}
            style={[styles.filterBtn, roleFilter === role && styles.filterActive]}
            onPress={() => { setRoleFilter(role); setPage(1); }}
          >
            <Text style={[styles.filterText, roleFilter === role && styles.filterTextActive]}>
              {role === null ? 'Todos' : role === 'client' ? 'Clientes' : role === 'caregiver' ? 'Cuidadores' : 'Admins'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
            </View>
          }
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
            onPress={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <Ionicons name="chevron-back" size={20} color={page === 1 ? colors.textMuted : colors.primary[600]} />
          </TouchableOpacity>
          <Text style={styles.pageText}>Página {page} de {totalPages}</Text>
          <TouchableOpacity
            style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
            onPress={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <Ionicons name="chevron-forward" size={20} color={page === totalPages ? colors.textMuted : colors.primary[600]} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  searchContainer: { padding: 16, backgroundColor: colors.white },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary[50], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchText: { flex: 1, marginLeft: 8, fontSize: 15, color: colors.textPrimary },
  filters: { flexDirection: 'row', padding: 16, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.white, fontWeight: '600' },
  listContent: { padding: 16 },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: 16, borderRadius: 12, marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.secondary[100], justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  userEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  userMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  clientRole: { backgroundColor: colors.secondary[100] },
  caregiverRole: { backgroundColor: colors.primary[50] },
  adminRole: { backgroundColor: colors.warning + '20' },
  roleText: { fontSize: 11, fontWeight: '600', color: colors.primary[700] },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  verifiedText: { fontSize: 11, color: colors.success },
  suspendedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  suspendedText: { fontSize: 11, color: colors.error },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 16 },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, gap: 16 },
  pageBtn: { padding: 8 },
  pageBtnDisabled: { opacity: 0.5 },
  pageText: { fontSize: 14, color: colors.textSecondary },
});
