import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CareLog {
  id: string;
  entry_type: string;
  description: string;
  vital_signs?: any;
  photo_base64?: string;
  created_at: string;
}

const entryTypes = [
  { id: 'activity', label: 'Atividade', icon: 'walk', color: colors.primary[500] },
  { id: 'medication', label: 'Medicação', icon: 'medical', color: colors.info },
  { id: 'meal', label: 'Refeição', icon: 'restaurant', color: colors.success },
  { id: 'vital_signs', label: 'Sinais Vitais', icon: 'pulse', color: colors.warning },
  { id: 'note', label: 'Observação', icon: 'document-text', color: colors.secondary[500] },
];

export default function CareLogScreen() {
  const router = useRouter();
  const { bookingId, elderName } = useLocalSearchParams<{ bookingId: string; elderName: string }>();
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('activity');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [vitalSigns, setVitalSigns] = useState({ pressure: '', temperature: '', heartRate: '' });
  const [summary, setSummary] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [bookingId]);

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/care-log/${bookingId}`);
      setLogs(response.data);
      // Check if already checked in
      const hasCheckIn = response.data.some((log: CareLog) => log.entry_type === 'check_in');
      setIsCheckedIn(hasCheckIn);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/care-log/${bookingId}/summary`);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  const handleCheckIn = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/care-log', {
        booking_id: bookingId,
        entry_type: 'check_in',
        description: `Check-in: Cuidador chegou para atender ${elderName}`,
      });
      setIsCheckedIn(true);
      fetchLogs();
      Alert.alert('Check-in realizado!', 'A família foi notificada da sua chegada.');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha no check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    Alert.alert(
      'Finalizar atendimento',
      'Deseja registrar o check-out e encerrar o atendimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await api.post('/care-log', {
                booking_id: bookingId,
                entry_type: 'check_out',
                description: `Check-out: Atendimento de ${elderName} finalizado`,
              });
              await fetchSummary();
              fetchLogs();
              Alert.alert('Check-out realizado!', 'O atendimento foi encerrado com sucesso.');
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.detail || 'Falha no check-out');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const submitEntry = async () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, descreva a atividade');
      return;
    }

    setIsSubmitting(true);
    try {
      const entryData: any = {
        booking_id: bookingId,
        entry_type: selectedType,
        description: description,
      };

      if (photo) {
        entryData.photo_base64 = photo;
      }

      if (selectedType === 'vital_signs' && (vitalSigns.pressure || vitalSigns.temperature || vitalSigns.heartRate)) {
        entryData.vital_signs = vitalSigns;
        entryData.description = `Sinais vitais: PA ${vitalSigns.pressure || '-'}, Temp ${vitalSigns.temperature || '-'}°C, FC ${vitalSigns.heartRate || '-'} bpm`;
      }

      await api.post('/care-log', entryData);
      setDescription('');
      setPhoto(null);
      setVitalSigns({ pressure: '', temperature: '', heartRate: '' });
      setShowForm(false);
      fetchLogs();
      Alert.alert('Sucesso', 'Registro adicionado! A família foi notificada.');
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha ao adicionar registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntryIcon = (type: string) => {
    const entry = entryTypes.find(e => e.id === type) || { icon: 'document', color: colors.textMuted };
    return entry;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Diário de Cuidado</Text>
          <Text style={styles.headerSubtitle}>{elderName}</Text>
        </View>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => router.push(`/emergency?bookingId=${bookingId}`)}
        >
          <Ionicons name="warning" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      {/* Check-in/Check-out Bar */}
      {!isCheckedIn ? (
        <TouchableOpacity
          style={styles.checkInBar}
          onPress={handleCheckIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="log-in" size={24} color={colors.white} />
              <Text style={styles.checkInText}>Fazer Check-in</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.checkedInBar}>
          <View style={styles.checkedInInfo}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.checkedInText}>Check-in realizado</Text>
          </View>
          <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
            <Text style={styles.checkOutText}>Check-out</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* AI Summary */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary[500]} />
              <Text style={styles.summaryTitle}>Resumo do Dia (IA)</Text>
            </View>
            <Text style={styles.summaryText}>{summary}</Text>
          </View>
        )}

        {/* Add Entry Form */}
        {showForm && isCheckedIn && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Novo Registro</Text>
            
            <View style={styles.typeSelector}>
              {entryTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeButton,
                    selectedType === type.id && { backgroundColor: type.color + '20', borderColor: type.color },
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Ionicons
                    name={type.icon as any}
                    size={20}
                    color={selectedType === type.id ? type.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      selectedType === type.id && { color: type.color },
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {selectedType === 'vital_signs' && (
              <View style={styles.vitalSignsForm}>
                <TextInput
                  style={styles.vitalInput}
                  placeholder="Pressão (ex: 12/8)"
                  placeholderTextColor={colors.textMuted}
                  value={vitalSigns.pressure}
                  onChangeText={(t) => setVitalSigns({ ...vitalSigns, pressure: t })}
                />
                <TextInput
                  style={styles.vitalInput}
                  placeholder="Temperatura °C"
                  placeholderTextColor={colors.textMuted}
                  value={vitalSigns.temperature}
                  onChangeText={(t) => setVitalSigns({ ...vitalSigns, temperature: t })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.vitalInput}
                  placeholder="Freq. Cardíaca bpm"
                  placeholderTextColor={colors.textMuted}
                  value={vitalSigns.heartRate}
                  onChangeText={(t) => setVitalSigns({ ...vitalSigns, heartRate: t })}
                  keyboardType="numeric"
                />
              </View>
            )}

            <TextInput
              style={styles.descriptionInput}
              placeholder="Descreva a atividade..."
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            {photo && (
              <View style={styles.photoPreview}>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity style={styles.removePhoto} onPress={() => setPhoto(null)}>
                  <Ionicons name="close-circle" size={24} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color={colors.primary[600]} />
                <Text style={styles.photoButtonText}>Foto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={submitEntry}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Adicionar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Logs Timeline */}
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Histórico</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary[500]} />
          ) : logs.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum registro ainda</Text>
          ) : (
            logs.map((log, index) => {
              const entryInfo = getEntryIcon(log.entry_type);
              return (
                <View key={log.id} style={styles.logItem}>
                  <View style={[styles.logIcon, { backgroundColor: entryInfo.color + '20' }]}>
                    <Ionicons name={entryInfo.icon as any} size={20} color={entryInfo.color} />
                  </View>
                  <View style={styles.logContent}>
                    <Text style={styles.logTime}>
                      {format(new Date(log.created_at), 'HH:mm', { locale: ptBR })}
                    </Text>
                    <Text style={styles.logDescription}>{log.description}</Text>
                    {log.photo_base64 && (
                      <Image source={{ uri: log.photo_base64 }} style={styles.logImage} />
                    )}
                  </View>
                  {index < logs.length - 1 && <View style={styles.logLine} />}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Entry FAB */}
      {isCheckedIn && !showForm && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowForm(true)}
        >
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emergencyButton: {
    padding: 8,
  },
  checkInBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    padding: 16,
    gap: 8,
  },
  checkInText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  checkedInBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.success + '20',
    padding: 12,
    paddingHorizontal: 16,
  },
  checkedInInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkedInText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
  },
  checkOutButton: {
    backgroundColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  checkOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[700],
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  typeButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  vitalSignsForm: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  vitalInput: {
    flex: 1,
    backgroundColor: colors.secondary[50],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descriptionInput: {
    backgroundColor: colors.secondary[50],
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  photoPreview: {
    marginTop: 12,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary[600],
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[600],
  },
  submitButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  timeline: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  logItem: {
    flexDirection: 'row',
    marginBottom: 16,
    position: 'relative',
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logContent: {
    flex: 1,
    marginLeft: 12,
  },
  logTime: {
    fontSize: 12,
    color: colors.textMuted,
  },
  logDescription: {
    fontSize: 14,
    color: colors.textPrimary,
    marginTop: 4,
    lineHeight: 20,
  },
  logImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 8,
  },
  logLine: {
    position: 'absolute',
    left: 19,
    top: 44,
    bottom: -12,
    width: 2,
    backgroundColor: colors.border,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
