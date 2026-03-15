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

import type {
  PublicFixture,
  PublicNewsArticle,
  PublicSeason,
} from "@nsl/shared";

import { FixtureMatchCard } from "../src/components/fixture-match-card";
import { formatPublishedDate } from "../src/lib/format";
import { publicApi } from "../src/lib/public-api";

type HomeState = {
  articles: PublicNewsArticle[];
  fixtures: PublicFixture[];
  seasons: PublicSeason[];
};

type HomeScreenProps = {
  onOpenNews: () => void;
  onOpenFixtures: () => void;
  onOpenArticle: (slug: string) => void;
  onOpenFixture: (fixtureId: string) => void;
};

const initialState: HomeState = {
  articles: [],
  fixtures: [],
  seasons: [],
};

export default function HomeScreen({ onOpenNews, onOpenFixtures, onOpenArticle, onOpenFixture }: HomeScreenProps) {
  const [data, setData] = useState<HomeState>(initialState);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setError(null);

        const [news, fixtures, seasons] = await Promise.all([
          publicApi.getNews({ limit: 4 }),
          publicApi.getFixtures(),
          publicApi.getSeasons(),
        ]);

        if (!isMounted) return;

        setData({
          articles: news.articles,
          fixtures: fixtures.fixtures.slice(0, 5),
          seasons: seasons.seasons.slice(0, 3),
        });
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load mobile home data.");
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
    setLoading(false);

    try {
      const [news, fixtures, seasons] = await Promise.all([
        publicApi.getNews({ limit: 4 }),
        publicApi.getFixtures(),
        publicApi.getSeasons(),
      ]);

      setError(null);
      setData({
        articles: news.articles,
        fixtures: fixtures.fixtures.slice(0, 5),
        seasons: seasons.seasons.slice(0, 3),
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to refresh mobile home data.");
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
        {/*
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>NSL Mobile</Text>
          <Text style={styles.title}>Live public data from the current web platform.</Text>
          <Text style={styles.copy}>
            News, fixtures, and season context are now coming from the existing Next.js API.
          </Text>
          <Text style={styles.baseUrl}>API base: {apiBaseUrl}</Text>
        </View>
        */}

        <View style={styles.bannerSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Latest News</Text>
            <Pressable onPress={onOpenNews}>
              <Text style={styles.sectionAction}>Browse all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bannerTrack}
          >
            {data.articles.length > 0 ? (
              data.articles.map((article) => (
                <Pressable
                  key={article.id}
                  style={styles.bannerCard}
                  onPress={() => onOpenArticle(article.slug)}
                >
                  <Text style={styles.bannerMeta}>{formatPublishedDate(article.publishedAt)}</Text>
                  <Text style={styles.bannerTitle} numberOfLines={2}>
                    {article.title}
                  </Text>
                  <Text style={styles.bannerCopy} numberOfLines={3}>
                    {article.excerpt || "Tap through to read the full story."}
                  </Text>
                  <Text style={styles.bannerLink}>Open story</Text>
                </Pressable>
              ))
            ) : (
              <View style={styles.bannerEmptyCard}>
                <Text style={styles.emptyTitle}>No published articles yet.</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Connection issue</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data.articles.length}</Text>
            <Text style={styles.metricLabel}>Featured stories</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data.fixtures.length}</Text>
            <Text style={styles.metricLabel}>Upcoming fixtures</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{data.seasons.length}</Text>
            <Text style={styles.metricLabel}>Published seasons</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Top News</Text>
          <Pressable onPress={onOpenNews}>
            <Text style={styles.sectionAction}>Open all</Text>
          </Pressable>
        </View>
        <View style={styles.stack}>
          {data.articles.map((article) => (
            <Pressable key={article.id} style={styles.surfaceCard} onPress={() => onOpenArticle(article.slug)}>
              <Text style={styles.cardEyebrow}>{formatPublishedDate(article.publishedAt)}</Text>
              <Text style={styles.cardTitle}>{article.title}</Text>
              {article.excerpt ? <Text style={styles.cardCopy}>{article.excerpt}</Text> : null}
            </Pressable>
          ))}
          {!loading && data.articles.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No published articles yet.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Upcoming Fixtures</Text>
          <Pressable onPress={onOpenFixtures}>
            <Text style={styles.sectionAction}>View schedule</Text>
          </Pressable>
        </View>
        <View style={styles.stack}>
          {data.fixtures.map((fixture) => (
            <FixtureMatchCard
              key={fixture.id}
              fixture={fixture}
              onPress={() => onOpenFixture(fixture.id)}
              showCompetition
            />
          ))}
          {!loading && data.fixtures.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No public fixtures are available.</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Active Seasons</Text>
        <View style={styles.chipRow}>
          {data.seasons.map((season) => (
            <View key={season.id} style={styles.chip}>
              <Text style={styles.chipText}>{season.seasonName}</Text>
            </View>
          ))}
          {!loading && data.seasons.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No published seasons found.</Text>
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
    backgroundColor: "#000000",
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 22,
    gap: 10,
    borderWidth: 1,
    borderColor: "#1e3a56",
  },
  eyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  copy: {
    color: "#c9d7e3",
    fontSize: 16,
    lineHeight: 24,
  },
  baseUrl: {
    color: "#fbbf24",
    fontSize: 13,
    lineHeight: 18,
  },
  errorCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
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
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  bannerSection: {
    gap: 12,
  },
  bannerTrack: {
    gap: 12,
    paddingRight: 20,
  },
  bannerCard: {
    width: 300,
    minHeight: 170,
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: "#1a3650",
    justifyContent: "space-between",
  },
  bannerMeta: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bannerTitle: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  bannerCopy: {
    color: "#bfd0de",
    fontSize: 14,
    lineHeight: 21,
  },
  bannerLink: {
    color: "#f59e0b",
    fontSize: 13,
    fontWeight: "700",
  },
  bannerEmptyCard: {
    width: 300,
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 18,
    borderWidth: 1,
    borderColor: "#18344d",
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18344d",
    gap: 4,
  },
  metricValue: {
    color: "#f8fafc",
    fontSize: 24,
    fontWeight: "800",
  },
  metricLabel: {
    color: "#90a7bb",
    fontSize: 12,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionAction: {
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "700",
  },
  stack: {
    gap: 12,
  },
  surfaceCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1a3650",
  },
  cardEyebrow: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  cardCopy: {
    color: "#bfd0de",
    fontSize: 14,
    lineHeight: 21,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    backgroundColor: "#173149",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#234767",
  },
  chipText: {
    color: "#eff6ff",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18344d",
  },
  emptyTitle: {
    color: "#90a7bb",
    fontSize: 14,
    lineHeight: 20,
  },
});