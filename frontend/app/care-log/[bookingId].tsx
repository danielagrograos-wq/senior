import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ENTRY_TYPES = [
  { id: 'check_in', icon: '📍', label: 'Check-in', color: colors.success },
  { id: 'check_out', icon: '👋', label: 'Check-out', color: colors.warning },
  { id: 'meal', icon: '🍽️', label: 'Refeição', color: colors.info },
  { id: 'medication', icon: '💊', label: 'Medicação', color: colors.error },
  { id: 'activity', icon: '🎯', label: 'Atividade', color: colors.primary[500] },
  { id: 'rest', icon: '😴', label: 'Descanso', color: colors.secondary[500] },
  { id: 'hygiene', icon: '🚿', label: 'Higiene', color: colors.primary[400] },
  { id: 'vital_signs', icon: '❤️', label: 'Sinais Vitais', color: colors.error },
  { id: 'observation', icon: '📝', label: 'Observação', color: colors.secondary[600] },
  { id: 'incident', icon: '⚠️', label: 'Incidente', color: colors.error },
];

const MOODS = [
  { id: 'happy', icon: '😊', label: 'Feliz' },
  { id: 'calm', icon: '😌', label: 'Calmo' },
  { id: 'anxious', icon: '😟', label: 'Ansioso' },
  { id: 'confused', icon: '😕', label: 'Confuso' },
  { id: 'agitated', icon: '😠', label: 'Agitado' },
];

export default function CareLogScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [medication, setMedication] = useState('');
  const [mealDescription, setMealDescription] = useState('');
  const [mood, setMood] = useState('');
  const [vitalSigns, setVitalSigns] = useState({ pressure: '', temperature: '', heart_rate: '' });

  const isCaregiver = user?.role === 'caregiver';

  useEffect(() => {
    fetchLogs();
    fetchSummary();
  }, [bookingId]);

  const fetchLogs = async () => {
    try {
      const response = await api.get(`/care-logs/${bookingId}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/care-logs/summary/${bookingId}`);
      setSummary(response.data.summary);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !description) {
      Alert.alert('Erro', 'Preencha o tipo e descrição');
      return;
    }

    setIsSubmitting(true);
    try {
      const data: any = {
        booking_id: bookingId,
        entry_type: selectedType,
        description,
        mood: mood || null,
      };

      if (selectedType === 'medication' && medication) {
        data.medication_given = medication;
      }
      if (selectedType === 'meal' && mealDescription) {
        data.meal_description = mealDescription;
      }
      if (selectedType === 'vital_signs' && (vitalSigns.pressure || vitalSigns.temperature)) {
        data.vital_signs = vitalSigns;
      }

      await api.post('/care-logs', data);
      Alert.alert('Sucesso', 'Registro adicionado!');
      setShowAddModal(false);
      resetForm();
      fetchLogs();
      fetchSummary();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha ao adicionar registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedType('');
    setDescription('');
    setMedication('');
    setMealDescription('');
    setMood('');
    setVitalSigns({ pressure: '', temperature: '', heart_rate: '' });
  };

  const getTypeInfo = (typeId: string) => ENTRY_TYPES.find(t => t.id === typeId);

  const renderLog = (log: any) => {
    const typeInfo = getTypeInfo(log.entry_type);
    return (
      <View key={log.id} style={styles.logCard}>
        <View style={[styles.logIcon, { backgroundColor: typeInfo?.color + '20' }]}>
          <Text style={styles.logEmoji}>{typeInfo?.icon}</Text>
        </View>
        <View style={styles.logContent}>
          <View style={styles.logHeader}>
            <Text style={styles.logType}>{typeInfo?.label}</Text>
            <Text style={styles.logTime}>
              {format(new Date(log.created_at), "HH:mm", { locale: ptBR })}
            </Text>
          </View>
          <Text style={styles.logDescription}>{log.description}</Text>
          {log.medication_given && (
            <View style={styles.logExtra}>
              <Ionicons name="medical" size={14} color={colors.error} />
              <Text style={styles.logExtraText}>{log.medication_given}</Text>
            </View>
          )}
          {log.meal_description && (
            <View style={styles.logExtra}>
              <Ionicons name="restaurant" size={14} color={colors.info} />
              <Text style={styles.logExtraText}>{log.meal_description}</Text>
            </View>
          )}
          {log.vital_signs && (
            <View style={styles.vitalSignsContainer}>
              {log.vital_signs.pressure && (
                <View style={styles.vitalSign}>
                  <Text style={styles.vitalLabel}>Pressão</Text>
                  <Text style={styles.vitalValue}>{log.vital_signs.pressure}</Text>
                </View>
              )}
              {log.vital_signs.temperature && (
                <View style={styles.vitalSign}>
                  <Text style={styles.vitalLabel}>Temp.</Text>
                  <Text style={styles.vitalValue}>{log.vital_signs.temperature}°C</Text>
                </View>
              )}
              {log.vital_signs.heart_rate && (
                <View style={styles.vitalSign}>
                  <Text style={styles.vitalLabel}>FC</Text>
                  <Text style={styles.vitalValue}>{log.vital_signs.heart_rate} bpm</Text>
                </View>
              )}
            </View>
          )}
          {log.mood && (
            <View style={styles.moodBadge}>
              <Text>{MOODS.find(m => m.id === log.mood)?.icon} {MOODS.find(m => m.id === log.mood)?.label}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Care Log</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Summary Card */}
          {summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>📊 Resumo do Dia</Text>
              <Text style={styles.summaryText}>{summary}</Text>
            </View>
          )}

          {/* Timeline */}
          <Text style={styles.sectionTitle}>🗓️ Linha do Tempo</Text>
          {logs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum registro ainda</Text>
            </View>
          ) : (
            logs.map(renderLog)
          )}
        </ScrollView>
      )}

      {/* Add Button (only for caregivers) */}
      {isCaregiver && (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={28} color={colors.white} />
        </TouchableOpacity>
      )}

      {/* Add Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Novo Registro</Text>
              <TouchableOpacity onPress={() => { setShowAddModal(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {/* Entry Type */}
              <Text style={styles.fieldLabel}>Tipo de Registro *</Text>
              <View style={styles.typesGrid}>
                {ENTRY_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.typeBtn, selectedType === type.id && { backgroundColor: type.color + '20', borderColor: type.color }]}
                    onPress={() => setSelectedType(type.id)}
                  >
                    <Text style={styles.typeEmoji}>{type.icon}</Text>
                    <Text style={[styles.typeLabel, selectedType === type.id && { color: type.color }]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={styles.fieldLabel}>Descrição *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Descreva o que aconteceu..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              {/* Medication (if type is medication) */}
              {selectedType === 'medication' && (
                <>
                  <Text style={styles.fieldLabel}>Medicação</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nome e dosagem"
                    value={medication}
                    onChangeText={setMedication}
                  />
                </>
              )}

              {/* Meal (if type is meal) */}
              {selectedType === 'meal' && (
                <>
                  <Text style={styles.fieldLabel}>Descrição da Refeição</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="O que comeu?"
                    value={mealDescription}
                    onChangeText={setMealDescription}
                  />
                </>
              )}

              {/* Vital Signs (if type is vital_signs) */}
              {selectedType === 'vital_signs' && (
                <>
                  <Text style={styles.fieldLabel}>Sinais Vitais</Text>
                  <View style={styles.vitalInputs}>
                    <TextInput
                      style={[styles.input, styles.vitalInput]}
                      placeholder="Pressão (120/80)"
                      value={vitalSigns.pressure}
                      onChangeText={(v) => setVitalSigns({ ...vitalSigns, pressure: v })}
                    />
                    <TextInput
                      style={[styles.input, styles.vitalInput]}
                      placeholder="Temp (°C)"
                      value={vitalSigns.temperature}
                      onChangeText={(v) => setVitalSigns({ ...vitalSigns, temperature: v })}
                      keyboardType="decimal-pad"
                    />
                    <TextInput
                      style={[styles.input, styles.vitalInput]}
                      placeholder="FC (bpm)"
                      value={vitalSigns.heart_rate}
                      onChangeText={(v) => setVitalSigns({ ...vitalSigns, heart_rate: v })}
                      keyboardType="number-pad"
                    />
                  </View>
                </>
              )}

              {/* Mood */}
              <Text style={styles.fieldLabel}>Humor do Idoso</Text>
              <View style={styles.moodsRow}>
                {MOODS.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.moodBtn, mood === m.id && styles.moodBtnActive]}
                    onPress={() => setMood(mood === m.id ? '' : m.id)}
                  >
                    <Text style={styles.moodEmoji}>{m.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>Salvar Registro</Text>
              )}
            </TouchableOpacity>
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
  scrollView: { flex: 1 },
  content: { padding: 16 },
  summaryCard: { backgroundColor: colors.primary[50], borderRadius: 16, padding: 16, marginBottom: 20, borderLeftWidth: 4, borderLeftColor: colors.primary[500] },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: colors.primary[700], marginBottom: 8 },
  summaryText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 },
  logCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 12, padding: 12, marginBottom: 12 },
  logIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  logEmoji: { fontSize: 20 },
  logContent: { flex: 1, marginLeft: 12 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logType: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  logTime: { fontSize: 12, color: colors.textMuted },
  logDescription: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  logExtra: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  logExtraText: { fontSize: 13, color: colors.textSecondary },
  vitalSignsContainer: { flexDirection: 'row', gap: 12, marginTop: 8 },
  vitalSign: { backgroundColor: colors.error + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  vitalLabel: { fontSize: 10, color: colors.textMuted },
  vitalValue: { fontSize: 14, fontWeight: '600', color: colors.error },
  moodBadge: { alignSelf: 'flex-start', backgroundColor: colors.secondary[100], paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: colors.textMuted, marginTop: 12 },
  addButton: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary[600], justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  modalScroll: { padding: 16, maxHeight: 500 },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 8, marginTop: 16 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { width: '30%', paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: colors.secondary[50], borderWidth: 2, borderColor: 'transparent' },
  typeEmoji: { fontSize: 24 },
  typeLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  input: { backgroundColor: colors.secondary[50], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  textArea: { backgroundColor: colors.secondary[50], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' },
  vitalInputs: { flexDirection: 'row', gap: 8 },
  vitalInput: { flex: 1 },
  moodsRow: { flexDirection: 'row', gap: 12 },
  moodBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.secondary[50], justifyContent: 'center', alignItems: 'center' },
  moodBtnActive: { backgroundColor: colors.primary[100], borderWidth: 2, borderColor: colors.primary[500] },
  moodEmoji: { fontSize: 24 },
  submitBtn: { backgroundColor: colors.primary[600], margin: 16, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: colors.white },
});
