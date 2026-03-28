import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "../../components/EmptyState";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { formatMatchDateTime, formatPublishedDate, formatScoreLine, formatFixtureStatus } from "../../lib/format";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";

import type { MobileHomeFeedResponse } from "../../types/api";

function getVideoMeta(embedUrl: string) {
  const youtubeMatch = embedUrl.match(/(?:embed\/|youtu\.be\/|v=)([A-Za-z0-9_-]{11})/);

  if (youtubeMatch?.[1]) {
    return {
      thumbnailUrl: `https://img.youtube.com/vi/${youtubeMatch[1]}/hqdefault.jpg`,
      badge: "YouTube",
    };
  }

  return {
    thumbnailUrl: null,
    badge: "Video",
  };
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { currentUser, isAuthenticated } = useAppSession();
  const [feed, setFeed] = useState<MobileHomeFeedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadFeed = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await mobileApi.getHomeFeed();

        if (isMounted) {
          setFeed(response);
        }
      } catch (loadError) {
        if (isMounted) {
          setFeed(null);
          setError(loadError instanceof Error ? loadError.message : "Unable to load the home feed.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadFeed();

    return () => {
      isMounted = false;
    };
  }, []);

  const featuredArticle = feed?.news[0] ?? null;
  const secondaryNews = feed?.news.slice(1, 4) ?? [];
  const featuredVideos = feed?.videos.slice(0, 3) ?? [];

  const homeHighlights = useMemo(() => {
    if (!feed) {
      return [] as Array<{ id: string; title: string; meta: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }>;
    }

    const liveFixtures = feed.fixtures.filter((fixture) => fixture.matchStatus === "IN_PROGRESS");
    const nextFixture = [...feed.fixtures]
      .filter((fixture) => fixture.matchStatus === "SCHEDULED" || fixture.scheduleStatus === "CONFIRMED" || fixture.scheduleStatus === "TBC")
      .sort((left, right) => (left.fixtureDateTime || "").localeCompare(right.fixtureDateTime || ""))[0];
    const topPlayer = feed.rankings[0];

    return [
      {
        id: "live-fixtures",
        title: liveFixtures.length === 0 ? "No live fixtures right now" : `${liveFixtures.length} live fixture${liveFixtures.length === 1 ? "" : "s"} on the league floor`,
        meta: liveFixtures.length === 0 ? "Check back as scores begin updating." : "Follow current scorelines as matches move through frames.",
        icon: "radio-tower",
      },
      {
        id: "top-player",
        title: topPlayer ? `${topPlayer.fullName} leads the rankings` : "Rankings are loading",
        meta: topPlayer ? `${topPlayer.points} pts • ${topPlayer.matchesWon}-${topPlayer.matchesLost} record` : "Player leaderboard will appear here.",
        icon: "podium-gold",
      },
      {
        id: "next-fixture",
        title: nextFixture ? `${nextFixture.homeTeamName} vs ${nextFixture.roadTeamName}` : "No upcoming fixture published",
        meta: nextFixture ? formatMatchDateTime(nextFixture.fixtureDateTime, nextFixture.fixtureTime) : "Upcoming televised and scheduled matches will surface here.",
        icon: "calendar-clock-outline",
      },
    ];
  }, [feed]);

  const openUrl = (url: string) => {
    void Linking.openURL(url);
  };

  const openLeagueBrowser = () => {
    navigation.navigate(isAuthenticated ? "LeagueContent" : "PublicLeagueContent");
  };

  return (
    <ScreenContainer>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Home</Text>
            <Text style={styles.heroTitle}>NSL Matchday</Text>
            <Text style={styles.heroSubtitle}>
              {isAuthenticated
                ? "Live news, featured videos, and league signals in one clean player feed."
                : "Public news, featured videos, fixtures, and rankings before you sign in."}
            </Text>
          </View>
          {isAuthenticated ? (
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{currentUser.initials}</Text>
            </View>
          ) : (
            <Pressable style={styles.accountButton} onPress={() => navigation.navigate("Login")} accessibilityRole="button" accessibilityLabel="Login or register">
              <MaterialCommunityIcons name="account-circle-outline" size={26} color={appTheme.colors.text} />
            </Pressable>
          )}
        </View>

        {!isAuthenticated ? (
          <Pressable style={styles.heroLink} onPress={openLeagueBrowser}>
            <Text style={styles.heroLinkText}>Browse tournaments, rankings, and groups without signing in</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? <LoadingSkeleton lines={8} height={18} /> : null}
      {!isLoading && error ? <EmptyState title="Home feed unavailable" description={error} icon="alert-circle-outline" /> : null}

      {!isLoading && !error && featuredArticle ? (
        <>
          <SectionHeader title="Featured Story" subtitle="Published news from the live public feed." />
          <View style={styles.featureCard}>
            {featuredArticle.coverImageUrl ? <Image source={{ uri: featuredArticle.coverImageUrl }} style={styles.featureImage} resizeMode="cover" /> : null}
            <View style={styles.featureBody}>
              <View style={styles.inlineMetaRow}>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>News</Text>
                </View>
                <Text style={styles.metaText}>{formatPublishedDate(featuredArticle.publishedAt)}</Text>
              </View>
              <Text style={styles.featureTitle}>{featuredArticle.title}</Text>
              <Text style={styles.featureCopy}>{featuredArticle.excerpt || "Published article"}</Text>
            </View>
          </View>

          {secondaryNews.length > 0 ? (
            <View style={styles.newsStack}>
              {secondaryNews.map((article) => (
                <View key={article.id} style={styles.newsCard}>
                  <View style={styles.newsCardCopy}>
                    <Text style={styles.newsTitle}>{article.title}</Text>
                    <Text style={styles.newsMeta}>{formatPublishedDate(article.publishedAt)}</Text>
                  </View>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={appTheme.colors.orange} />
                </View>
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      {!isLoading && !error ? (
        <>
          <SectionHeader title="Featured Videos" subtitle="Pulled from the live public highlights feed." />
          <View style={styles.videoStack}>
            {featuredVideos.map((video) => {
              const presentation = getVideoMeta(video.embedUrl);

              return (
                <Pressable key={video.id} style={styles.videoCard} onPress={() => openUrl(video.watchUrl)}>
                  {presentation.thumbnailUrl ? <Image source={{ uri: presentation.thumbnailUrl }} style={styles.videoThumb} resizeMode="cover" /> : <View style={styles.videoThumbFallback}><MaterialCommunityIcons name="play-circle-outline" size={26} color={appTheme.colors.text} /></View>}
                  <View style={styles.videoContent}>
                    <View style={styles.inlineMetaRow}>
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{presentation.badge}</Text>
                      </View>
                    </View>
                    <Text style={styles.videoTitle}>{video.title}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <SectionHeader title="League Highlights" subtitle="Live league signals drawn from fixtures and rankings." />
          <View style={styles.highlightStack}>
            {homeHighlights.map((item) => (
              <View key={item.id} style={styles.highlightCard}>
                <View style={styles.highlightIconWrap}>
                  <MaterialCommunityIcons name={item.icon as never} size={18} color={appTheme.colors.orange} />
                </View>
                <View style={styles.highlightCopy}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightMeta}>{item.meta}</Text>
                </View>
              </View>
            ))}
          </View>

          {feed?.fixtures.length ? (
            <>
              <SectionHeader title="Match Pulse" subtitle="Recent live or published fixtures from the public schedule." />
              <View style={styles.fixtureStack}>
                {feed.fixtures.slice(0, 3).map((fixture) => (
                  <View key={fixture.id} style={styles.fixtureCard}>
                    <View style={styles.fixtureHeader}>
                      <Text style={styles.fixtureCompetition}>{fixture.fixtureGroupDesc}</Text>
                      <View style={styles.metaBadge}>
                        <Text style={styles.metaBadgeText}>{formatFixtureStatus(fixture)}</Text>
                      </View>
                    </View>
                    <Text style={styles.fixturePlayers}>{fixture.homeTeamName} vs {fixture.roadTeamName}</Text>
                    <Text style={styles.fixtureMeta}>{formatMatchDateTime(fixture.fixtureDateTime, fixture.fixtureTime)}</Text>
                    <Text style={styles.fixtureScore}>{formatScoreLine(fixture)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: appTheme.spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 12,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    color: appTheme.colors.orange,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  heroSubtitle: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  heroBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  heroBadgeText: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontWeight: "900",
  },
  accountButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceStrong,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  heroLink: {
    alignSelf: "flex-start",
  },
  heroLinkText: {
    color: appTheme.colors.teal,
    fontSize: 13,
    fontWeight: "700",
  },
  featureCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    overflow: "hidden",
  },
  featureImage: {
    width: "100%",
    height: 180,
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  featureBody: {
    padding: appTheme.spacing.lg,
    gap: 10,
  },
  inlineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureTitle: {
    color: appTheme.colors.text,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 24,
  },
  featureCopy: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: appTheme.colors.orangeSoft,
    borderWidth: 1,
    borderColor: "rgba(239, 159, 63, 0.24)",
  },
  metaBadgeText: {
    color: appTheme.colors.orange,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metaText: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  newsStack: {
    gap: 10,
  },
  newsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: appTheme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  newsCardCopy: {
    flex: 1,
    gap: 4,
  },
  newsTitle: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  newsMeta: {
    color: appTheme.colors.textMuted,
    fontSize: 11,
  },
  videoStack: {
    gap: 10,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    overflow: "hidden",
  },
  videoThumb: {
    width: 118,
    minHeight: 88,
    backgroundColor: appTheme.colors.surface,
  },
  videoThumbFallback: {
    width: 118,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surface,
  },
  videoContent: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 12,
    gap: 8,
    justifyContent: "center",
  },
  videoTitle: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
  },
  highlightStack: {
    gap: 12,
  },
  highlightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: appTheme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
  },
  highlightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  highlightCopy: {
    flex: 1,
    gap: 2,
  },
  highlightTitle: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  highlightMeta: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  fixtureStack: {
    gap: 10,
  },
  fixtureCard: {
    padding: appTheme.spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 8,
  },
  fixtureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  fixtureCompetition: {
    flex: 1,
    color: appTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  fixturePlayers: {
    color: appTheme.colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  fixtureMeta: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
  },
  fixtureScore: {
    color: appTheme.colors.gold,
    fontSize: 18,
    fontWeight: "900",
  },
});