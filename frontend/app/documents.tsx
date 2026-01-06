import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Document {
  id: string;
  doc_type: string;
  status: string;
  expiry_date?: string;
  days_until_expiry?: number;
  is_expiring_soon?: boolean;
  is_expired?: boolean;
  created_at: string;
}

const docTypes = [
  { id: 'background_check', label: 'Antecedentes Criminais', icon: 'shield-checkmark', required: true },
  { id: 'id_document', label: 'Documento de Identidade', icon: 'card', required: true },
  { id: 'certification', label: 'Certificações', icon: 'ribbon', required: false },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/caregivers/documents');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickDocument = async (docType: string) => {
    Alert.alert(
      'Selecionar Documento',
      'Como você deseja enviar o documento?',
      [
        {
          text: 'Tirar Foto',
          onPress: () => takePhoto(docType),
        },
        {
          text: 'Galeria',
          onPress: () => pickFromGallery(docType),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const takePhoto = async (docType: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await uploadDocument(docType, `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const pickFromGallery = async (docType: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      await uploadDocument(docType, `data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const uploadDocument = async (docType: string, docBase64: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('doc_type', docType);
      formData.append('doc_base64', docBase64);

      await api.post('/caregivers/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Sucesso', 'Documento enviado para análise!');
      fetchDocuments();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha ao enviar documento');
    } finally {
      setIsUploading(false);
    }
  };

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.doc_type === docType);
    return doc;
  };

  const getStatusBadge = (doc: Document | undefined) => {
    if (!doc) {
      return { label: 'Pendente', color: colors.warning, bg: colors.warning + '20' };
    }
    if (doc.is_expired) {
      return { label: 'Expirado', color: colors.error, bg: colors.error + '20' };
    }
    if (doc.is_expiring_soon) {
      return { label: `Expira em ${doc.days_until_expiry} dias`, color: colors.warning, bg: colors.warning + '20' };
    }
    switch (doc.status) {
      case 'approved':
        return { label: 'Aprovado', color: colors.success, bg: colors.success + '20' };
      case 'rejected':
        return { label: 'Rejeitado', color: colors.error, bg: colors.error + '20' };
      case 'pending':
      default:
        return { label: 'Em análise', color: colors.info, bg: colors.info + '20' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Documentos</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Mantenha seus documentos atualizados para continuar recebendo solicitações. 
            Antecedentes criminais devem ser renovados a cada 6 meses.
          </Text>
        </View>

        {/* Document Cards */}
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary[500]} style={{ marginTop: 40 }} />
        ) : (
          docTypes.map((docType) => {
            const doc = getDocumentStatus(docType.id);
            const statusBadge = getStatusBadge(doc);

            return (
              <View key={docType.id} style={styles.documentCard}>
                <View style={styles.docHeader}>
                  <View style={[styles.docIcon, { backgroundColor: colors.primary[100] }]}>
                    <Ionicons name={docType.icon as any} size={24} color={colors.primary[600]} />
                  </View>
                  <View style={styles.docInfo}>
                    <View style={styles.docTitleRow}>
                      <Text style={styles.docTitle}>{docType.label}</Text>
                      {docType.required && (
                        <Text style={styles.requiredBadge}>Obrigatório</Text>
                      )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
                      <Text style={[styles.statusText, { color: statusBadge.color }]}>
                        {statusBadge.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {doc && doc.expiry_date && (
                  <View style={styles.expiryInfo}>
                    <Ionicons name="calendar" size={14} color={colors.textSecondary} />
                    <Text style={styles.expiryText}>
                      Válido até: {format(new Date(doc.expiry_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    doc?.status === 'approved' && !doc.is_expiring_soon && !doc.is_expired && styles.uploadButtonSecondary,
                  ]}
                  onPress={() => pickDocument(docType.id)}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Ionicons
                        name={doc ? 'refresh' : 'cloud-upload'}
                        size={18}
                        color={doc?.status === 'approved' && !doc.is_expiring_soon && !doc.is_expired ? colors.primary[600] : colors.white}
                      />
                      <Text
                        style={[
                          styles.uploadButtonText,
                          doc?.status === 'approved' && !doc.is_expiring_soon && !doc.is_expired && styles.uploadButtonTextSecondary,
                        ]}
                      >
                        {doc ? 'Atualizar Documento' : 'Enviar Documento'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Precisa de ajuda?</Text>
          <Text style={styles.helpText}>
            Se tiver dúvidas sobre a verificação de documentos, entre em contato com nosso suporte.
          </Text>
          <TouchableOpacity style={styles.helpButton}>
            <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary[600]} />
            <Text style={styles.helpButtonText}>Falar com Suporte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  requiredBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.error,
    backgroundColor: colors.error + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  expiryText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  uploadButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  uploadButtonTextSecondary: {
    color: colors.primary[600],
  },
  helpSection: {
    backgroundColor: colors.secondary[50],
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  helpText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },
});
