import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Booking {
  id: string;
  caregiver_id: string;
  caregiver_name: string;
  caregiver_photo?: string;
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
  check_in_time?: string;
  check_out_time?: string;
  created_at: string;
}

interface MediaItem {
  id: string;
  media_base64: string;
  media_type: string;
  caption: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: colors.warning, bg: colors.warning + '20' },
  confirmed: { label: 'Confirmado', color: colors.info, bg: colors.info + '20' },
  in_progress: { label: 'Em andamento', color: colors.primary[600], bg: colors.primary[100] },
  completed: { label: 'Concluído', color: colors.success, bg: colors.success + '20' },
  cancelled: { label: 'Cancelado', color: colors.error, bg: colors.error + '20' },
};

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [caption, setCaption] = useState('');

  const isCaregiver = user?.role === 'caregiver';

  useEffect(() => {
    fetchBooking();
    fetchMedia();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${id}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const response = await api.get(`/media/${id}`);
      setMedia(response.data);
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const handleUploadMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setIsUploading(true);
      try {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await api.post('/media', {
          booking_id: id,
          media_base64: base64Image,
          media_type: 'photo',
          caption: caption || null,
        });
        setCaption('');
        fetchMedia();
        Alert.alert('Sucesso', 'Foto enviada com sucesso!');
      } catch (error: any) {
        Alert.alert('Erro', error.response?.data?.detail || 'Falha ao enviar foto');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      await api.put(`/bookings/${id}/status?status=${newStatus}`);
      fetchBooking();
      Alert.alert('Sucesso', `Status atualizado para: ${statusConfig[newStatus]?.label}`);
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha ao atualizar status');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Agendamento não encontrado</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const status = statusConfig[booking.status] || statusConfig.pending;
  const startDate = new Date(booking.start_datetime);
  const endDate = new Date(booking.end_datetime);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes</Text>
        {isCaregiver && booking.status === 'in_progress' && (
          <TouchableOpacity
            style={styles.emergencyHeaderBtn}
            onPress={() => router.push(`/emergency?bookingId=${booking.id}`)}
          >
            <Ionicons name="warning" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusContainer, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informações</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={18} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>{isCaregiver ? 'Cliente' : 'Cuidador'}:</Text>
            <Text style={styles.infoValue}>{isCaregiver ? booking.client_name : booking.caregiver_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={18} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Idoso:</Text>
            <Text style={styles.infoValue}>{booking.elder_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={18} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Data:</Text>
            <Text style={styles.infoValue}>{format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time" size={18} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Horário:</Text>
            <Text style={styles.infoValue}>{format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}</Text>
          </View>
          {booking.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Observações:</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Valores</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Serviço</Text>
            <Text style={styles.priceValue}>R$ {(booking.price_cents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Taxa da plataforma</Text>
            <Text style={styles.priceValue}>R$ {(booking.platform_fee_cents / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {(booking.total_cents / 100).toFixed(2)}</Text>
          </View>
        </View>

        {/* Care Log Button */}
        {(booking.status === 'in_progress' || booking.status === 'completed') && (
          <TouchableOpacity
            style={styles.careLogButton}
            onPress={() => router.push(`/care-log?bookingId=${booking.id}&elderName=${booking.elder_name}`)}
          >
            <Ionicons name="journal" size={24} color={colors.primary[600]} />
            <View style={styles.careLogInfo}>
              <Text style={styles.careLogTitle}>Diário de Cuidado</Text>
              <Text style={styles.careLogSubtitle}>Visualizar registros e atualizações</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Atualizações</Text>
          {isCaregiver && booking.status === 'in_progress' && (
            <View style={styles.uploadSection}>
              <TextInput
                style={styles.captionInput}
                placeholder="Legenda da foto (opcional)..."
                placeholderTextColor={colors.textMuted}
                value={caption}
                onChangeText={setCaption}
              />
              <TouchableOpacity
                style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
                onPress={handleUploadMedia}
                disabled={isUploading}
              >
                {isUploading ? <ActivityIndicator color={colors.white} /> : (
                  <>
                    <Ionicons name="camera" size={20} color={colors.white} />
                    <Text style={styles.uploadButtonText}>Enviar foto</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          {media.length > 0 ? (
            <View style={styles.mediaGrid}>
              {media.map((item) => (
                <View key={item.id} style={styles.mediaItem}>
                  <Image source={{ uri: item.media_base64 }} style={styles.mediaImage} />
                  {item.caption && <Text style={styles.mediaCaption}>{item.caption}</Text>}
                  <Text style={styles.mediaTime}>{format(new Date(item.created_at), 'HH:mm', { locale: ptBR })}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noMediaText}>
              {booking.status === 'in_progress' ? (isCaregiver ? 'Envie fotos para atualizar a família' : 'Aguarde atualizações do cuidador') : 'Nenhuma atualização disponível'}
            </Text>
          )}
        </View>

        {isCaregiver && (
          <View style={styles.actionsCard}>
            {booking.status === 'pending' && (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleUpdateStatus('confirmed')}>
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                  <Text style={styles.actionBtnText}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleUpdateStatus('cancelled')}>
                  <Ionicons name="close" size={20} color={colors.error} />
                  <Text style={[styles.actionBtnText, { color: colors.error }]}>Recusar</Text>
                </TouchableOpacity>
              </>
            )}
            {booking.status === 'confirmed' && (
              <TouchableOpacity style={[styles.actionBtn, styles.startBtn]} onPress={() => handleUpdateStatus('in_progress')}>
                <Ionicons name="play" size={20} color={colors.white} />
                <Text style={styles.actionBtnText}>Iniciar atendimento</Text>
              </TouchableOpacity>
            )}
            {booking.status === 'in_progress' && (
              <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleUpdateStatus('completed')}>
                <Ionicons name="checkmark-done" size={20} color={colors.white} />
                <Text style={styles.actionBtnText}>Finalizar atendimento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, paddingHorizontal: 40 },
  errorText: { fontSize: 18, color: colors.textPrimary, marginTop: 16 },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary[600], borderRadius: 12 },
  backBtnText: { color: colors.white, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  emergencyHeaderBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 16, gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8 },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '500', color: colors.textPrimary, flex: 1 },
  notesContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  notesLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  priceLabel: { fontSize: 14, color: colors.textSecondary },
  priceValue: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: colors.primary[600] },
  careLogButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 },
  careLogInfo: { flex: 1 },
  careLogTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  careLogSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  uploadSection: { marginBottom: 16 },
  captionInput: { backgroundColor: colors.secondary[50], borderRadius: 12, padding: 12, fontSize: 14, color: colors.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[600], borderRadius: 12, paddingVertical: 12, gap: 8 },
  uploadButtonDisabled: { opacity: 0.7 },
  uploadButtonText: { color: colors.white, fontWeight: '600' },
  mediaGrid: { gap: 12 },
  mediaItem: { backgroundColor: colors.secondary[50], borderRadius: 12, overflow: 'hidden' },
  mediaImage: { width: '100%', height: 200, resizeMode: 'cover' },
  mediaCaption: { padding: 12, paddingBottom: 4, fontSize: 14, color: colors.textPrimary },
  mediaTime: { padding: 12, paddingTop: 4, fontSize: 12, color: colors.textSecondary },
  noMediaText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  actionsCard: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  acceptBtn: { backgroundColor: colors.success },
  rejectBtn: { backgroundColor: colors.error + '20' },
  startBtn: { backgroundColor: colors.info },
  completeBtn: { backgroundColor: colors.success },
  actionBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
