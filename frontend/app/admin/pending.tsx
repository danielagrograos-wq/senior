import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';

export default function AdminPendingCaregivers() {
  const router = useRouter();
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchPendingCaregivers();
  }, []);

  const fetchPendingCaregivers = async () => {
    try {
      const response = await api.get('/admin/caregivers/pending');
      setCaregivers(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (caregiver: any) => {
    Alert.alert(
      'Aprovar Cuidador',
      `Deseja aprovar ${caregiver.user_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprovar',
          onPress: async () => {
            try {
              await api.put(`/admin/caregivers/${caregiver.id}/approve`);
              Alert.alert('Sucesso', 'Cuidador aprovado!');
              fetchPendingCaregivers();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível aprovar');
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      Alert.alert('Erro', 'Informe o motivo da rejeição');
      return;
    }
    try {
      await api.put(`/admin/caregivers/${selectedCaregiver.id}/reject?reason=${encodeURIComponent(rejectReason)}`);
      Alert.alert('Sucesso', 'Cuidador rejeitado');
      setShowRejectModal(false);
      setRejectReason('');
      fetchPendingCaregivers();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível rejeitar');
    }
  };

  const renderCaregiver = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.textMuted} />
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.user_name || 'Nome não informado'}</Text>
          <Text style={styles.email}>{item.user_email}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>
              {item.background_check_status === 'pending' ? '⏳ Verificação Pendente' : '❌ Não Verificado'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Especialidades</Text>
          <Text style={styles.detailValue}>{item.specialties?.join(', ') || 'Não informado'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Experiência</Text>
          <Text style={styles.detailValue}>{item.experience_years || 0} anos</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Preço/hora</Text>
          <Text style={styles.detailValue}>R$ {item.hourly_rate || 0}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleApprove(item)}
        >
          <Ionicons name="checkmark" size={20} color={colors.white} />
          <Text style={styles.actionBtnText}>Aprovar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => { setSelectedCaregiver(item); setShowRejectModal(true); }}
        >
          <Ionicons name="close" size={20} color={colors.error} />
          <Text style={[styles.actionBtnText, { color: colors.error }]}>Rejeitar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificações Pendentes</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={caregivers}
          keyExtractor={(item) => item.id}
          renderItem={renderCaregiver}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              <Text style={styles.emptyText}>Nenhuma verificação pendente!</Text>
            </View>
          }
        />
      )}

      {/* Reject Modal */}
      <Modal visible={showRejectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejeitar Cuidador</Text>
            <Text style={styles.modalSubtitle}>Informe o motivo da rejeição:</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Motivo..."
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => { setShowRejectModal(false); setRejectReason(''); }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleReject}>
                <Text style={styles.modalConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  listContent: { padding: 16 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.secondary[100], justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { backgroundColor: colors.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginTop: 6 },
  statusText: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  details: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  detailLabel: { fontSize: 13, color: colors.textSecondary },
  detailValue: { fontSize: 13, fontWeight: '500', color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  approveBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error + '10', borderWidth: 1, borderColor: colors.error },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: colors.white },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: colors.textSecondary, marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.white, borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 16 },
  modalInput: { backgroundColor: colors.secondary[50], borderRadius: 10, padding: 12, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.secondary[100], alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: colors.error, alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '600', color: colors.white },
});
