import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { PublicNewsArticle } from "@nsl/shared";

import { formatPublishedDate } from "../src/lib/format";
import { publicApi } from "../src/lib/public-api";

type NewsScreenProps = {
  onOpenArticle: (slug: string) => void;
};

export default function NewsScreen({ onOpenArticle }: NewsScreenProps) {
  const [articles, setArticles] = useState<PublicNewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await publicApi.getNews();
        if (!isMounted) return;
        setArticles(response.articles);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch public news.");
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
  }, []);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      const response = await publicApi.getNews();
      setArticles(response.articles);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to refresh public news.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Public News</Text>
          <Text style={styles.title}>Published stories from the NSL site.</Text>
          <Text style={styles.copy}>This screen reads the same article feed used by the public website.</Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load news</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {articles.map((article) => (
            <Pressable key={article.id} style={styles.articleCard} onPress={() => onOpenArticle(article.slug)}>
              <Text style={styles.articleMeta}>{formatPublishedDate(article.publishedAt)}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              {article.excerpt ? <Text style={styles.articleExcerpt}>{article.excerpt}</Text> : null}
              <Text style={styles.slug}>/{article.slug}</Text>
            </Pressable>
          ))}
          {!loading && articles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No published articles are available yet.</Text>
            </View>
          ) : null}
        </View>
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
    gap: 18,
    paddingBottom: 40,
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
  copy: {
    color: "#c9d7e3",
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: 12,
  },
  articleCard: {
    backgroundColor: "#10243a",
    borderRadius: 22,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1a3650",
  },
  articleMeta: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  articleTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  articleExcerpt: {
    color: "#bfd0de",
    fontSize: 14,
    lineHeight: 21,
  },
  slug: {
    color: "#8ca5bb",
    fontSize: 13,
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
  emptyCard: {
    backgroundColor: "#0b1d2f",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18344d",
  },
  emptyText: {
    color: "#90a7bb",
    fontSize: 14,
    lineHeight: 20,
  },
});