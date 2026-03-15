import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PublicNewsArticleDetail } from "@nsl/shared";

import { formatPublishedDateLong, stripHtml } from "../src/lib/format";
import { publicApi } from "../src/lib/public-api";

type NewsDetailScreenProps = {
  slug: string;
  onBack: () => void;
};

export default function NewsDetailScreen({ slug, onBack }: NewsDetailScreenProps) {
  const [article, setArticle] = useState<PublicNewsArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await publicApi.getNewsArticle(slug);
        if (!isMounted) return;
        setArticle(response.article);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch article.");
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      const response = await publicApi.getNewsArticle(slug);
      setArticle(response.article);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to refresh article.");
    } finally {
      setRefreshing(false);
    }
  }

  const paragraphs = article ? stripHtml(article.contentHtml).split(/(?<=[.!?])\s+/).filter(Boolean) : [];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to News</Text>
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load article</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {article ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.eyebrow}>{formatPublishedDateLong(article.publishedAt)}</Text>
              <Text style={styles.title}>{article.title}</Text>
              {article.excerpt ? <Text style={styles.excerpt}>{article.excerpt}</Text> : null}
              <Text style={styles.slug}>/{article.slug}</Text>
            </View>

            {article.coverImageUrl ? (
              <View style={styles.coverFrame}>
                <Image source={{ uri: article.coverImageUrl }} style={styles.coverImage} resizeMode="cover" />
              </View>
            ) : null}

            <View style={styles.bodyCard}>
              <Text style={styles.bodyTitle}>Article</Text>
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => (
                  <Text key={`${article.id}-${index}`} style={styles.bodyCopy}>
                    {paragraph}
                  </Text>
                ))
              ) : (
                <Text style={styles.bodyCopy}>No article body is available yet.</Text>
              )}
            </View>
          </>
        ) : null}

        {loading && !article ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading article...</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07131f",
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#10243a",
    borderWidth: 1,
    borderColor: "#1e3a56",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backButtonText: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: "#10243a",
    borderRadius: 28,
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: "#1e3a56",
  },
  eyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  excerpt: {
    color: "#c9d7e3",
    fontSize: 15,
    lineHeight: 22,
  },
  slug: {
    color: "#8ca5bb",
    fontSize: 13,
  },
  coverFrame: {
    backgroundColor: "#0b1d2f",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#18344d",
  },
  coverImage: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  bodyCard: {
    backgroundColor: "#10243a",
    borderRadius: 24,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1a3650",
  },
  bodyTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  bodyCopy: {
    color: "#bfd0de",
    fontSize: 15,
    lineHeight: 24,
  },
  errorCard: {
    backgroundColor: "#3a1516",
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: "#6d2023",
  },
  errorTitle: {
    color: "#fecaca",
    fontSize: 16,
    fontWeight: "700",
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 14,
    lineHeight: 20,
  },
  loadingCard: {
    backgroundColor: "#0b1d2f",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18344d",
  },
  loadingText: {
    color: "#90a7bb",
    fontSize: 14,
  },
});