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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';

export default function PaymentScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [familyShares, setFamilyShares] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFamilyShare, setShowFamilyShare] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePercent, setInvitePercent] = useState('50');

  // Mock card data (in production, use Stripe Elements)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  useEffect(() => {
    fetchBookingDetails();
    fetchFamilyShares();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Error fetching booking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFamilyShares = async () => {
    try {
      const response = await api.get(`/family-share/${bookingId}`);
      setFamilyShares(response.data);
    } catch (error) {
      console.error('Error fetching family shares:', error);
    }
  };

  const handlePayment = async () => {
    if (!cardNumber || !cardExpiry || !cardCvc) {
      Alert.alert('Erro', 'Por favor, preencha todos os dados do cartão');
      return;
    }

    setIsProcessing(true);
    try {
      // Create payment intent
      const intentResponse = await api.post('/payments/create-intent', {
        booking_id: bookingId,
      });

      // Simulate payment confirmation (in production, use Stripe SDK)
      await api.post(`/payments/confirm?booking_id=${bookingId}&payment_intent_id=${intentResponse.data.payment_intent_id}`);

      Alert.alert(
        'Pagamento Confirmado! ✅',
        'Seu pagamento foi processado com sucesso. O valor será liberado para o cuidador após a conclusão do serviço.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha ao processar pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInviteFamilyShare = async () => {
    if (!inviteEmail || !invitePercent) {
      Alert.alert('Erro', 'Preencha email e porcentagem');
      return;
    }

    try {
      await api.post('/family-share/invite', {
        booking_id: bookingId,
        email: inviteEmail,
        share_percent: parseInt(invitePercent),
      });

      Alert.alert('Convite Enviado!', 'O familiar receberá uma notificação para dividir o pagamento.');
      setInviteEmail('');
      setInvitePercent('50');
      setShowFamilyShare(false);
      fetchFamilyShares();
    } catch (error: any) {
      Alert.alert('Erro', error.response?.data?.detail || 'Falha ao enviar convite');
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted.slice(0, 19));
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      setCardExpiry(cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4));
    } else {
      setCardExpiry(cleaned);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  const myShareAmount = familyShares
    ? familyShares.owner_amount_cents
    : booking?.total_cents;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Order Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumo do Pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cuidador</Text>
            <Text style={styles.summaryValue}>{booking?.caregiver_name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Idoso</Text>
            <Text style={styles.summaryValue}>{booking?.elder_name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Serviço</Text>
            <Text style={styles.summaryValue}>R$ {(booking?.price_cents / 100).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxa da plataforma</Text>
            <Text style={styles.summaryValue}>R$ {(booking?.platform_fee_cents / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>R$ {(booking?.total_cents / 100).toFixed(2)}</Text>
          </View>
        </View>

        {/* Family Share Section */}
        <View style={styles.card}>
          <View style={styles.familyShareHeader}>
            <View>
              <Text style={styles.cardTitle}>Family Share</Text>
              <Text style={styles.familyShareSubtitle}>Divida o custo com familiares</Text>
            </View>
            <TouchableOpacity
              style={styles.addShareButton}
              onPress={() => setShowFamilyShare(!showFamilyShare)}
            >
              <Ionicons name={showFamilyShare ? 'remove' : 'add'} size={20} color={colors.primary[600]} />
            </TouchableOpacity>
          </View>

          {showFamilyShare && (
            <View style={styles.inviteForm}>
              <TextInput
                style={styles.inviteInput}
                placeholder="Email do familiar"
                placeholderTextColor={colors.textMuted}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.percentRow}>
                <TextInput
                  style={[styles.inviteInput, styles.percentInput]}
                  placeholder="%"
                  placeholderTextColor={colors.textMuted}
                  value={invitePercent}
                  onChangeText={setInvitePercent}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <TouchableOpacity style={styles.inviteButton} onPress={handleInviteFamilyShare}>
                  <Text style={styles.inviteButtonText}>Convidar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {familyShares?.shares?.length > 0 && (
            <View style={styles.sharesList}>
              {familyShares.shares.map((share: any) => (
                <View key={share.id} style={styles.shareItem}>
                  <View style={styles.shareInfo}>
                    <Text style={styles.shareEmail}>{share.invitee_email}</Text>
                    <Text style={styles.shareAmount}>
                      {share.share_percent}% - R$ {(share.amount_cents / 100).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.shareStatus, share.paid ? styles.sharePaid : styles.sharePending]}>
                    <Text style={[styles.shareStatusText, share.paid && styles.sharePaidText]}>
                      {share.paid ? 'Pago' : share.status === 'accepted' ? 'Aguardando' : 'Pendente'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {familyShares && (
            <View style={styles.myShareContainer}>
              <Text style={styles.myShareLabel}>Sua parte ({familyShares.owner_share_percent}%)</Text>
              <Text style={styles.myShareValue}>R$ {(myShareAmount / 100).toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Payment Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dados do Cartão</Text>
          <View style={styles.cardIcons}>
            <Ionicons name="card" size={24} color={colors.primary[600]} />
            <Text style={styles.secureText}>Pagamento seguro</Text>
            <Ionicons name="lock-closed" size={16} color={colors.success} />
          </View>

          <TextInput
            style={styles.cardInput}
            placeholder="Número do cartão"
            placeholderTextColor={colors.textMuted}
            value={cardNumber}
            onChangeText={formatCardNumber}
            keyboardType="numeric"
            maxLength={19}
          />

          <View style={styles.cardRow}>
            <TextInput
              style={[styles.cardInput, styles.halfInput]}
              placeholder="MM/AA"
              placeholderTextColor={colors.textMuted}
              value={cardExpiry}
              onChangeText={formatExpiry}
              keyboardType="numeric"
              maxLength={5}
            />
            <TextInput
              style={[styles.cardInput, styles.halfInput]}
              placeholder="CVC"
              placeholderTextColor={colors.textMuted}
              value={cardCvc}
              onChangeText={setCardCvc}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        {/* Escrow Notice */}
        <View style={styles.escrowNotice}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary[600]} />
          <Text style={styles.escrowText}>
            Seu pagamento ficará em custódia e só será liberado para o cuidador após a conclusão do serviço.
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.payButtonContainer}>
        <TouchableOpacity
          style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
          onPress={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="lock-closed" size={20} color={colors.white} />
              <Text style={styles.payButtonText}>
                Pagar R$ {(myShareAmount / 100).toFixed(2)}
              </Text>
            </>
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
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 8,
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
  familyShareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  familyShareSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addShareButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteForm: {
    marginTop: 16,
  },
  inviteInput: {
    backgroundColor: colors.secondary[50],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  percentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  percentInput: {
    width: 80,
  },
  inviteButton: {
    flex: 1,
    backgroundColor: colors.primary[600],
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  sharesList: {
    marginTop: 16,
  },
  shareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shareInfo: {},
  shareEmail: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  shareAmount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  shareStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sharePending: {
    backgroundColor: colors.warning + '20',
  },
  sharePaid: {
    backgroundColor: colors.success + '20',
  },
  shareStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  sharePaidText: {
    color: colors.success,
  },
  myShareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  myShareLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary[700],
  },
  myShareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary[700],
  },
  cardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  secureText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  cardInput: {
    backgroundColor: colors.secondary[50],
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  escrowText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 18,
  },
  payButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
});
