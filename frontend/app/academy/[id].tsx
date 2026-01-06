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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/src/services/api';
import { colors } from '@/src/theme/colors';
import Markdown from 'react-native-markdown-display';

export default function ArticleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/academy/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Artigo</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text>Artigo não encontrado</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{article.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.articleHeader}>
          <Text style={styles.articleTitle}>{article.title}</Text>
          <View style={styles.articleMeta}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.articleTime}>{article.read_time} min de leitura</Text>
          </View>
        </View>

        <View style={styles.articleContent}>
          <Markdown
            style={{
              body: { fontSize: 16, lineHeight: 26, color: colors.textPrimary },
              heading2: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 12, color: colors.textPrimary },
              heading3: { fontSize: 17, fontWeight: '600', marginTop: 20, marginBottom: 8, color: colors.textPrimary },
              bullet_list: { marginVertical: 8 },
              bullet_list_icon: { color: colors.primary[500], marginRight: 8 },
              list_item: { marginVertical: 4 },
              strong: { fontWeight: '600', color: colors.primary[700] },
            }}
          >
            {article.content}
          </Markdown>
        </View>

        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <Text style={styles.completedText}>Artigo marcado como lido!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1, textAlign: 'center', marginHorizontal: 8 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  articleHeader: { marginBottom: 24 },
  articleTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, lineHeight: 32 },
  articleMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  articleTime: { fontSize: 14, color: colors.textMuted },
  articleContent: { backgroundColor: colors.white, borderRadius: 16, padding: 20 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success + '20', borderRadius: 12, padding: 16, marginTop: 24, gap: 8 },
  completedText: { fontSize: 14, fontWeight: '600', color: colors.success },
});
