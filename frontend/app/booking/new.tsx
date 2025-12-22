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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { format, addHours, setHours, setMinutes, startOfTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Caregiver {
  id: string;
  user_name: string;
  price_hour: number;
  price_night: number | null;
}

const PLATFORM_FEE_PERCENT = 15;

export default function NewBookingScreen() {
  const router = useRouter();
  const { caregiverId } = useLocalSearchParams<{ caregiverId: string }>();
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking form state
  const [serviceType, setServiceType] = useState<'hourly' | 'night_shift'>('hourly');
  const [selectedDate, setSelectedDate] = useState(startOfTomorrow());
  const [startHour, setStartHour] = useState(8);
  const [duration, setDuration] = useState(4);
  const [notes, setNotes] = useState('');

  // Available dates (next 14 days)
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  // Available hours
  const availableHours = Array.from({ length: 16 }, (_, i) => i + 6); // 6am to 9pm

  // Duration options
  const durationOptions = [2, 3, 4, 6, 8, 10, 12];

  useEffect(() => {
    fetchCaregiver();
  }, [caregiverId]);

  const fetchCaregiver = async () => {
    try {
      const response = await api.get(`/caregivers/${caregiverId}`);
      setCaregiver(response.data);
    } catch (error) {
      console.error('Error fetching caregiver:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do cuidador');
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!caregiver) return { price: 0, fee: 0, total: 0 };

    let price = 0;
    if (serviceType === 'night_shift' && caregiver.price_night) {
      price = caregiver.price_night;
    } else {
      price = duration * caregiver.price_hour;
    }

    const fee = (price * PLATFORM_FEE_PERCENT) / 100;
    const total = price + fee;

    return { price, fee, total };
  };

  const getStartDateTime = () => {
    let dateTime = setHours(selectedDate, startHour);
    dateTime = setMinutes(dateTime, 0);
    return dateTime;
  };

  const getEndDateTime = () => {
    const start = getStartDateTime();
    if (serviceType === 'night_shift') {
      return addHours(start, 12);
    }
    return addHours(start, duration);
  };

  const handleSubmit = async () => {
    if (!caregiver) return;

    setIsSubmitting(true);
    try {
      const bookingData = {
        caregiver_id: caregiverId,
        start_datetime: getStartDateTime().toISOString(),
        end_datetime: getEndDateTime().toISOString(),
        service_type: serviceType,
        notes: notes || null,
      };

      await api.post('/bookings', bookingData);
      Alert.alert(
        'Sucesso!',
        'Sua solicitação foi enviada. Aguarde a confirmação do cuidador.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
      );
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.detail || 'Falha ao criar agendamento'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const { price, fee, total } = calculatePrice();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!caregiver) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Cuidador não encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Agendamento</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Caregiver Info */}
        <View style={styles.caregiverInfo}>
          <View style={styles.caregiverAvatar}>
            <Ionicons name="person" size={24} color={colors.textMuted} />
          </View>
          <View>
            <Text style={styles.caregiverName}>{caregiver.user_name}</Text>
            <Text style={styles.caregiverPrice}>
              R$ {caregiver.price_hour.toFixed(0)}/hora
            </Text>
          </View>
        </View>

        {/* Service Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de serviço</Text>
          <View style={styles.serviceTypeContainer}>
            <TouchableOpacity
              style={[
                styles.serviceTypeButton,
                serviceType === 'hourly' && styles.serviceTypeButtonActive,
              ]}
              onPress={() => setServiceType('hourly')}
            >
              <Ionicons
                name="time"
                size={24}
                color={serviceType === 'hourly' ? colors.white : colors.primary[600]}
              />
              <Text
                style={[
                  styles.serviceTypeText,
                  serviceType === 'hourly' && styles.serviceTypeTextActive,
                ]}
              >
                Por hora
              </Text>
              <Text
                style={[
                  styles.serviceTypePrice,
                  serviceType === 'hourly' && styles.serviceTypePriceActive,
                ]}
              >
                R$ {caregiver.price_hour.toFixed(0)}/h
              </Text>
            </TouchableOpacity>

            {caregiver.price_night && (
              <TouchableOpacity
                style={[
                  styles.serviceTypeButton,
                  serviceType === 'night_shift' && styles.serviceTypeButtonActive,
                ]}
                onPress={() => setServiceType('night_shift')}
              >
                <Ionicons
                  name="moon"
                  size={24}
                  color={serviceType === 'night_shift' ? colors.white : colors.primary[600]}
                />
                <Text
                  style={[
                    styles.serviceTypeText,
                    serviceType === 'night_shift' && styles.serviceTypeTextActive,
                  ]}
                >
                  Plantão noturno
                </Text>
                <Text
                  style={[
                    styles.serviceTypePrice,
                    serviceType === 'night_shift' && styles.serviceTypePriceActive,
                  ]}
                >
                  R$ {caregiver.price_night.toFixed(0)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateContainer}
          >
            {availableDates.map((date) => {
              const isSelected =
                date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={date.toISOString()}
                  style={[
                    styles.dateButton,
                    isSelected && styles.dateButtonActive,
                  ]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text
                    style={[
                      styles.dateDayName,
                      isSelected && styles.dateTextActive,
                    ]}
                  >
                    {format(date, 'EEE', { locale: ptBR })}
                  </Text>
                  <Text
                    style={[
                      styles.dateDay,
                      isSelected && styles.dateTextActive,
                    ]}
                  >
                    {format(date, 'dd')}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      isSelected && styles.dateTextActive,
                    ]}
                  >
                    {format(date, 'MMM', { locale: ptBR })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário de início</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeContainer}
          >
            {availableHours.map((hour) => {
              const isSelected = hour === startHour;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.timeButton,
                    isSelected && styles.timeButtonActive,
                  ]}
                  onPress={() => setStartHour(hour)}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isSelected && styles.timeTextActive,
                    ]}
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Duration Selection (only for hourly) */}
        {serviceType === 'hourly' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duração</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.durationContainer}
            >
              {durationOptions.map((d) => {
                const isSelected = d === duration;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[
                      styles.durationButton,
                      isSelected && styles.durationButtonActive,
                    ]}
                    onPress={() => setDuration(d)}
                  >
                    <Text
                      style={[
                        styles.durationText,
                        isSelected && styles.durationTextActive,
                      ]}
                    >
                      {d}h
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Informações adicionais para o cuidador..."
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumo</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Data</Text>
            <Text style={styles.summaryValue}>
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Horário</Text>
            <Text style={styles.summaryValue}>
              {format(getStartDateTime(), 'HH:mm')} -{' '}
              {format(getEndDateTime(), 'HH:mm')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Serviço</Text>
            <Text style={styles.summaryValue}>
              R$ {price.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa da plataforma ({PLATFORM_FEE_PERCENT}%)</Text>
            <Text style={styles.summaryValue}>R$ {fee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitButtonText}>Confirmar agendamento</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  caregiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  caregiverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  caregiverPrice: {
    fontSize: 14,
    color: colors.primary[600],
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  serviceTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  serviceTypeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary[200],
    alignItems: 'center',
  },
  serviceTypeButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  serviceTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
    marginTop: 8,
  },
  serviceTypeTextActive: {
    color: colors.white,
  },
  serviceTypePrice: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  serviceTypePriceActive: {
    color: colors.primary[100],
  },
  dateContainer: {
    gap: 8,
  },
  dateButton: {
    width: 70,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  dateDayName: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  dateDay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 4,
  },
  dateMonth: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  dateTextActive: {
    color: colors.white,
  },
  timeContainer: {
    gap: 8,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  timeTextActive: {
    color: colors.white,
  },
  durationContainer: {
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  durationTextActive: {
    color: colors.white,
  },
  notesInput: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
