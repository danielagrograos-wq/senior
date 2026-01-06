import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import { useAuth } from '@/src/contexts/AuthContext';

export default function AcademyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [progress, setProgress] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, artRes, courseRes, progRes] = await Promise.all([
        api.get('/academy/categories'),
        api.get('/academy/articles'),
        api.get('/academy/courses'),
        api.get('/academy/progress'),
      ]);
      setCategories(catRes.data);
      setArticles(artRes.data);
      setCourses(courseRes.data);
      setProgress(progRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchArticlesByCategory = async (category: string | null) => {
    setSelectedCategory(category);
    try {
      const url = category ? `/academy/articles?category=${category}` : '/academy/articles';
      const response = await api.get(url);
      setArticles(response.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SeniorCare Academy</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Progress Card */}
        {progress && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>🎓 Seu Progresso</Text>
              <Text style={styles.progressPercent}>{progress.progress_percent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress.progress_percent}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {progress.articles_read} de {progress.total_articles} artigos lidos
            </Text>
          </View>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categorias</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryBtn, selectedCategory === null && styles.categoryActive]}
            onPress={() => fetchArticlesByCategory(null)}
          >
            <Text style={styles.categoryIcon}>📚</Text>
            <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>Todos</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryBtn, selectedCategory === cat.id && styles.categoryActive]}
              onPress={() => fetchArticlesByCategory(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Articles */}
        <Text style={styles.sectionTitle}>📖 Artigos</Text>
        {articles.map((article) => (
          <TouchableOpacity
            key={article.id}
            style={styles.articleCard}
            onPress={() => router.push(`/academy/${article.id}`)}
          >
            <View style={styles.articleContent}>
              <View style={styles.articleHeader}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                {progress?.read_articles?.includes(article.id) && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
              </View>
              <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
              <View style={styles.articleMeta}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.articleTime}>{article.read_time} min de leitura</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Courses */}
        <Text style={styles.sectionTitle}>🏆 Cursos</Text>
        {courses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            <View style={styles.courseBadge}>
              <Text style={styles.courseBadgeText}>{course.badge}</Text>
            </View>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseDescription}>{course.description}</Text>
            <View style={styles.courseMeta}>
              <View style={styles.courseMetaItem}>
                <Ionicons name="layers-outline" size={16} color={colors.primary[600]} />
                <Text style={styles.courseMetaText}>{course.modules} módulos</Text>
              </View>
              <View style={styles.courseMetaItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary[600]} />
                <Text style={styles.courseMetaText}>{course.duration_hours}h</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.courseBtn}>
              <Text style={styles.courseBtnText}>Em breve</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  progressCard: { backgroundColor: colors.primary[50], borderRadius: 16, padding: 16, marginBottom: 20 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressTitle: { fontSize: 16, fontWeight: '600', color: colors.primary[700] },
  progressPercent: { fontSize: 24, fontWeight: 'bold', color: colors.primary[600] },
  progressBar: { height: 8, backgroundColor: colors.primary[100], borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary[500], borderRadius: 4 },
  progressText: { fontSize: 13, color: colors.primary[600], marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 12, marginTop: 8 },
  categoriesScroll: { marginBottom: 20 },
  categoryBtn: { backgroundColor: colors.white, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginRight: 10, alignItems: 'center', minWidth: 90 },
  categoryActive: { backgroundColor: colors.primary[600] },
  categoryIcon: { fontSize: 24, marginBottom: 4 },
  categoryText: { fontSize: 12, color: colors.textSecondary },
  categoryTextActive: { color: colors.white, fontWeight: '600' },
  articleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 12 },
  articleContent: { flex: 1 },
  articleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  articleTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1, marginRight: 8 },
  articleSummary: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  articleTime: { fontSize: 12, color: colors.textMuted },
  courseCard: { backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 16 },
  courseBadge: { alignSelf: 'flex-start', marginBottom: 12 },
  courseBadgeText: { fontSize: 32 },
  courseTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 8 },
  courseDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  courseMeta: { flexDirection: 'row', gap: 16, marginTop: 12 },
  courseMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  courseMetaText: { fontSize: 13, color: colors.primary[600] },
  courseBtn: { backgroundColor: colors.secondary[100], borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  courseBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
