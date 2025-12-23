import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';

interface AcademyContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  category: string;
  thumbnail?: string;
  duration_minutes?: number;
}

const categories = [
  { id: '', label: 'Todos' },
  { id: 'caregiver_training', label: 'Treinamento' },
  { id: 'family_support', label: 'Para Famílias' },
  { id: 'health_tips', label: 'Saúde' },
  { id: 'legal', label: 'Legal' },
];

export default function AcademyScreen() {
  const router = useRouter();
  const [content, setContent] = useState<AcademyContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchContent();
  }, [selectedCategory]);

  const fetchContent = async () => {
    try {
      const params = selectedCategory ? { category: selectedCategory } : {};
      const response = await api.get('/academy', { params });
      setContent(response.data);
    } catch (error) {
      console.error('Error fetching academy content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return 'play-circle';
      case 'article':
        return 'document-text';
      case 'quiz':
        return 'help-circle';
      default:
        return 'book';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'caregiver_training':
        return colors.primary[500];
      case 'family_support':
        return colors.info;
      case 'health_tips':
        return colors.success;
      case 'legal':
        return colors.warning;
      default:
        return colors.textMuted;
    }
  };

  const renderContentCard = ({ item }: { item: AcademyContent }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.cardImage}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: getCategoryColor(item.category) + '30' }]}>
            <Ionicons
              name={getTypeIcon(item.content_type) as any}
              size={40}
              color={getCategoryColor(item.category)}
            />
          </View>
        )}
        {item.content_type === 'video' && item.duration_minutes && (
          <View style={styles.durationBadge}>
            <Ionicons name="time" size={12} color={colors.white} />
            <Text style={styles.durationText}>{item.duration_minutes} min</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <View style={[styles.typeBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
          <Text style={[styles.typeBadgeText, { color: getCategoryColor(item.category) }]}>
            {categories.find(c => c.id === item.category)?.label || item.category}
          </Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SeniorCare Academy</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.heroSection}>
        <Ionicons name="school" size={48} color={colors.primary[500]} />
        <Text style={styles.heroTitle}>Aprenda e Cresça</Text>
        <Text style={styles.heroSubtitle}>
          Conteúdos exclusivos para cuidadores e famílias
        </Text>
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === item.id && styles.categoryChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <FlatList
          data={content}
          keyExtractor={(item) => item.id}
          renderItem={renderContentCard}
          contentContainerStyle={styles.contentList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="book-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyText}>Nenhum conteúdo disponível</Text>
            </View>
          }
        />
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
  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.primary[50],
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentList: {
    padding: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: colors.white,
  },
  cardContent: {
    padding: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: 16,
  },
});
