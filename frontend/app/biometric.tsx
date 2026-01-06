import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';

export default function BiometricScreen() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [biometricStatus, setBiometricStatus] = useState<any>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const response = await api.get('/biometric/status');
      setBiometricStatus(response.data);
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para verificação facial.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
      cameraType: ImagePicker.CameraType.front,
    });

    if (!result.canceled && result.assets[0].base64) {
      setSelfie(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const verifyBiometric = async () => {
    if (!selfie) {
      Alert.alert('Erro', 'Por favor, tire uma selfie primeiro');
      return;
    }

    setIsVerifying(true);
    try {
      const formData = new FormData();
      formData.append('selfie_base64', selfie);

      const response = await api.post('/biometric/daily-check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setStatus('success');
        Alert.alert(
          'Verificação Concluída!',
          'Sua identidade foi verificada com sucesso.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        setStatus('failed');
        Alert.alert('Verificação Falhou', response.data.message);
      }
    } catch (error: any) {
      setStatus('failed');
      Alert.alert('Erro', error.response?.data?.detail || 'Falha na verificação');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verificação Facial</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {/* Status Badge */}
        {biometricStatus && !biometricStatus.needs_verification && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={styles.verifiedText}>Verificado hoje</Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={32} color={colors.primary[500]} />
          <Text style={styles.instructionsTitle}>Verificação Diária</Text>
          <Text style={styles.instructionsText}>
            Para garantir a segurança dos idosos e famílias, precisamos verificar sua identidade diariamente.
          </Text>
        </View>

        {/* Selfie Area */}
        <View style={styles.selfieContainer}>
          {selfie ? (
            <Image source={{ uri: selfie }} style={styles.selfieImage} />
          ) : (
            <View style={styles.selfiePlaceholder}>
              <Ionicons name="person-circle" size={80} color={colors.textMuted} />
              <Text style={styles.selfiePlaceholderText}>Tire uma selfie</Text>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Dicas para uma boa foto:</Text>
          <View style={styles.tipRow}>
            <Ionicons name="sunny" size={16} color={colors.warning} />
            <Text style={styles.tipText}>Ambiente bem iluminado</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="eye" size={16} color={colors.info} />
            <Text style={styles.tipText}>Olhe diretamente para a câmera</Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="glasses" size={16} color={colors.primary[500]} />
            <Text style={styles.tipText}>Remova óculos escuros ou chapéus</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={takeSelfie}>
            <Ionicons name="camera" size={24} color={colors.white} />
            <Text style={styles.cameraButtonText}>
              {selfie ? 'Tirar Nova Foto' : 'Tirar Selfie'}
            </Text>
          </TouchableOpacity>

          {selfie && (
            <TouchableOpacity
              style={[styles.verifyButton, isVerifying && styles.verifyButtonDisabled]}
              onPress={verifyBiometric}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="finger-print" size={24} color={colors.white} />
                  <Text style={styles.verifyButtonText}>Verificar Identidade</Text>
                </>
              )}
            </TouchableOpacity>
          )}
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
  content: {
    flex: 1,
    padding: 20,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  verifiedText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
  },
  instructionsCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  selfieContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  selfieImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: colors.primary[500],
  },
  selfiePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  selfiePlaceholderText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
  },
  tipsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  actionsContainer: {
    gap: 12,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary[600],
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
});
