import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';

export default function EmergencyScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const emergencyTypes = [
    { id: 'medical', label: 'Emergência Médica', icon: 'medical', color: colors.error },
    { id: 'fall', label: 'Queda', icon: 'body', color: colors.warning },
    { id: 'unresponsive', label: 'Não Responsivo', icon: 'alert-circle', color: colors.error },
    { id: 'other', label: 'Outro', icon: 'help-circle', color: colors.info },
  ];

  const triggerEmergency = async () => {
    if (!selectedType || !bookingId) {
      Alert.alert('Erro', 'Selecione o tipo de emergência');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar Emergência',
      'Isso enviará um alerta IMEDIATO para a família e registrará a emergência. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'CONFIRMAR EMERGÊNCIA',
          style: 'destructive',
          onPress: async () => {
            setIsTriggering(true);
            try {
              const response = await api.post('/emergency', {
                booking_id: bookingId,
                emergency_type: selectedType,
                description: `Emergência: ${emergencyTypes.find(t => t.id === selectedType)?.label}`,
              });

              Alert.alert(
                'Alerta Enviado!',
                `A família foi notificada.\n\n${response.data.emergency_services_info}`,
                [
                  { text: 'Ligar SAMU (192)', onPress: () => Linking.openURL('tel:192') },
                  { text: 'OK', onPress: () => router.back() },
                ]
              );
            } catch (error: any) {
              Alert.alert('Erro', error.response?.data?.detail || 'Falha ao enviar alerta');
            } finally {
              setIsTriggering(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EMERGÊNCIA</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={80} color={colors.white} />
        </View>

        <Text style={styles.title}>Botão de Pânico</Text>
        <Text style={styles.subtitle}>
          Selecione o tipo de emergência e confirme para alertar a família imediatamente
        </Text>

        <View style={styles.typesContainer}>
          {emergencyTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonSelected,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Ionicons
                name={type.icon as any}
                size={32}
                color={selectedType === type.id ? colors.white : type.color}
              />
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.typeLabelSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.emergencyButton, isTriggering && styles.emergencyButtonDisabled]}
          onPress={triggerEmergency}
          disabled={isTriggering || !selectedType}
        >
          {isTriggering ? (
            <ActivityIndicator color={colors.white} size="large" />
          ) : (
            <>
              <Ionicons name="alert" size={40} color={colors.white} />
              <Text style={styles.emergencyButtonText}>ENVIAR ALERTA</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.quickCallContainer}>
          <Text style={styles.quickCallLabel}>Ligação rápida:</Text>
          <View style={styles.quickCallButtons}>
            <TouchableOpacity
              style={styles.quickCallButton}
              onPress={() => Linking.openURL('tel:192')}
            >
              <Text style={styles.quickCallText}>SAMU 192</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickCallButton}
              onPress={() => Linking.openURL('tel:193')}
            >
              <Text style={styles.quickCallText}>Bombeiros 193</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.error,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginRight: 44,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
  },
  typesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  typeButton: {
    width: '45%',
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  typeButtonSelected: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 2,
    borderColor: colors.white,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 8,
  },
  typeLabelSelected: {
    color: colors.white,
  },
  emergencyButton: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  emergencyButtonDisabled: {
    opacity: 0.5,
  },
  emergencyButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 8,
  },
  quickCallContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  quickCallLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 12,
  },
  quickCallButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickCallButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  quickCallText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
