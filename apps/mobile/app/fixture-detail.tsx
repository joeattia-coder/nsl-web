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

import type { PublicFixtureDetail } from "@nsl/shared";

import { FixtureMatchCard } from "../src/components/fixture-match-card";
import { formatScoreLine } from "../src/lib/format";
import { publicApi } from "../src/lib/public-api";

type FixtureDetailScreenProps = {
  fixtureId: string;
  onBack: () => void;
};

export default function FixtureDetailScreen({ fixtureId, onBack }: FixtureDetailScreenProps) {
  const [fixture, setFixture] = useState<PublicFixtureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await publicApi.getFixture(fixtureId);
        if (!isMounted) return;
        setFixture(response.fixture);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch fixture.");
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
  }, [fixtureId]);

  async function handleRefresh() {
    setRefreshing(true);

    try {
      const response = await publicApi.getFixture(fixtureId);
      setFixture(response.fixture);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to refresh fixture.");
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
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Fixtures</Text>
        </Pressable>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load fixture</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {fixture ? (
          <>
            <FixtureMatchCard fixture={fixture} showCompetition />

            <View style={styles.scoreRow}>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Scoreline</Text>
                <Text style={styles.scoreValue}>{formatScoreLine(fixture)}</Text>
              </View>
              <View style={styles.scoreCard}>
                <Text style={styles.scoreLabel}>Round</Text>
                <Text style={styles.scoreValue}>{fixture.roundDesc}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Competition</Text>
              <Text style={styles.infoCopy}>{fixture.fixtureGroupDesc}</Text>
              <Text style={styles.infoTitle}>Season</Text>
              <Text style={styles.infoCopy}>{fixture.seasonDesc}</Text>
              <Text style={styles.infoTitle}>Format</Text>
              <Text style={styles.infoCopy}>{fixture.roundType}</Text>
            </View>

            {fixture.venue ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Venue</Text>
                <Text style={styles.infoCopy}>{fixture.venue.name}</Text>
                <Text style={styles.infoSubCopy}>{fixture.venue.summary}</Text>
              </View>
            ) : null}

            {fixture.publicNote ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Public Note</Text>
                <Text style={styles.infoCopy}>{fixture.publicNote}</Text>
              </View>
            ) : null}
          </>
        ) : null}

        {loading && !fixture ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading fixture...</Text>
          </View>
        ) : null}
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
  scoreRow: {
    flexDirection: "row",
    gap: 12,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#18344d",
  },
  scoreLabel: {
    color: "#90a7bb",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scoreValue: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: "#1a3650",
  },
  infoTitle: {
    color: "#7dd3fc",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  infoCopy: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  infoSubCopy: {
    color: "#bfd0de",
    fontSize: 14,
    lineHeight: 21,
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
  loadingCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18344d",
  },
  loadingText: {
    color: "#90a7bb",
    fontSize: 14,
  },
});