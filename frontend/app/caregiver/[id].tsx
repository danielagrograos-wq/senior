import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';

interface CaregiverDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  bio: string;
  price_hour: number;
  price_night: number | null;
  certifications: string[];
  city: string;
  neighborhood: string;
  experience_years: number;
  specializations: string[];
  available: boolean;
  verified: boolean;
  background_check_status: string;
  biometric_verified: boolean;
  rating: number;
  total_reviews: number;
  photo: string | null;
  created_at: string;
}

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export default function CaregiverDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [caregiver, setCaregiver] = useState<CaregiverDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCaregiver();
    fetchReviews();
  }, [id]);

  const fetchCaregiver = async () => {
    try {
      const response = await api.get(`/caregivers/${id}`);
      setCaregiver(response.data);
    } catch (error) {
      console.error('Error fetching caregiver:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={colors.warning}
        />
      );
    }
    return stars;
  };

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
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorText}>Cuidador não encontrado</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Perfil do Cuidador</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {caregiver.photo ? (
                <Image source={{ uri: caregiver.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={40} color={colors.textMuted} />
                </View>
              )}
              {caregiver.available && <View style={styles.onlineBadge} />}
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName}>{caregiver.user_name}</Text>
                {caregiver.verified && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary[500]} />
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {caregiver.neighborhood}, {caregiver.city}
                </Text>
              </View>
              <View style={styles.ratingRow}>
                <View style={styles.stars}>{renderStars(Math.round(caregiver.rating))}</View>
                <Text style={styles.ratingText}>
                  {caregiver.rating.toFixed(1)} ({caregiver.total_reviews} avaliações)
                </Text>
              </View>
            </View>
          </View>

          {/* Verification Badges */}
          <View style={styles.badgesContainer}>
            {caregiver.verified && (
              <View style={[styles.badge, styles.badgeVerified]}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <Text style={[styles.badgeText, { color: colors.success }]}>
                  Antecedentes OK
                </Text>
              </View>
            )}
            {caregiver.biometric_verified && (
              <View style={[styles.badge, styles.badgeBiometric]}>
                <Ionicons name="finger-print" size={16} color={colors.info} />
                <Text style={[styles.badgeText, { color: colors.info }]}>
                  Biometria Ativa
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Prices Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preços</Text>
          <View style={styles.pricesContainer}>
            <View style={styles.priceItem}>
              <Ionicons name="time" size={24} color={colors.primary[600]} />
              <Text style={styles.priceValue}>R$ {caregiver.price_hour.toFixed(0)}</Text>
              <Text style={styles.priceLabel}>Por hora</Text>
            </View>
            {caregiver.price_night && (
              <View style={styles.priceItem}>
                <Ionicons name="moon" size={24} color={colors.secondary[600]} />
                <Text style={styles.priceValue}>R$ {caregiver.price_night.toFixed(0)}</Text>
                <Text style={styles.priceLabel}>Plantão noturno</Text>
              </View>
            )}
          </View>
        </View>

        {/* About Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sobre</Text>
          <Text style={styles.bioText}>{caregiver.bio || 'Sem descrição disponível.'}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase" size={18} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {caregiver.experience_years}{' '}
              {caregiver.experience_years === 1 ? 'ano' : 'anos'} de experiência
            </Text>
          </View>
        </View>

        {/* Specializations Card */}
        {caregiver.specializations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Especializações</Text>
            <View style={styles.tagsContainer}>
              {caregiver.specializations.map((spec, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reviews Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avaliações</Text>
          {reviews.length > 0 ? (
            reviews.slice(0, 5).map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.client_name}</Text>
                  <View style={styles.reviewStars}>{renderStars(review.rating)}</View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noReviewsText}>Ainda sem avaliações</Text>
          )}
        </View>

        {/* Contact Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contato</Text>
          <View style={styles.contactItem}>
            <Ionicons name="call" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{caregiver.user_phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <Ionicons name="mail" size={18} color={colors.textSecondary} />
            <Text style={styles.contactText}>{caregiver.user_email}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      {user?.role === 'client' && (
        <View style={styles.bottomCTA}>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/booking/new?caregiverId=${caregiver.id}`)}
          >
            <Text style={styles.bookButtonText}>Contratar agora</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: colors.textPrimary,
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary[600],
    borderRadius: 12,
  },
  backButtonText: {
    color: colors.white,
    fontWeight: '600',
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
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: colors.secondary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
  },
  ratingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  badgeVerified: {
    backgroundColor: colors.success + '20',
  },
  badgeBiometric: {
    backgroundColor: colors.info + '20',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  pricesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  priceItem: {
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  bioText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: '500',
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  noReviewsText: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactText: {
    fontSize: 15,
    color: colors.textPrimary,
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
  bookButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
