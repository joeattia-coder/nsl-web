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

import type { PublicFixture } from "@nsl/shared";

import { FixtureMatchCard } from "../src/components/fixture-match-card";
import { publicApi } from "../src/lib/public-api";

type GroupedFixtures = Record<string, PublicFixture[]>;

type FixturesScreenProps = {
  onOpenFixture: (fixtureId: string) => void;
};

export default function FixturesScreen({ onOpenFixture }: FixturesScreenProps) {
  const [fixtures, setFixtures] = useState<PublicFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const response = await publicApi.getFixtures();
        if (!isMounted) return;
        setFixtures(response.fixtures);
        setError(null);
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to fetch fixtures.");
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
      const response = await publicApi.getFixtures();
      setFixtures(response.fixtures);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to refresh fixtures.");
    } finally {
      setRefreshing(false);
    }
  }

  const groupedFixtures = fixtures.reduce<GroupedFixtures>((groups, fixture) => {
    const key = fixture.fixtureGroupDesc || "Unassigned";
    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(fixture);
    return groups;
  }, {});

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f59e0b" />}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Fixtures</Text>
          <Text style={styles.title}>Match schedule grouped by tournament.</Text>
          <Text style={styles.copy}>Scores and status updates come straight from the existing public fixtures endpoint.</Text>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to load fixtures</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {Object.entries(groupedFixtures).map(([groupName, groupFixtures]) => (
            <View key={groupName} style={styles.groupCard}>
              <Text style={styles.groupTitle}>{groupName}</Text>
              <Text style={styles.groupMeta}>{groupFixtures.length} public matches</Text>
              <View style={styles.groupFixtures}>
                {groupFixtures.slice(0, 8).map((fixture) => (
                  <FixtureMatchCard
                    key={fixture.id}
                    fixture={fixture}
                    onPress={() => onOpenFixture(fixture.id)}
                  />
                ))}
              </View>
            </View>
          ))}
          {!loading && fixtures.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No public fixtures are available yet.</Text>
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
    gap: 14,
  },
  groupCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: "#1a3650",
  },
  groupTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "800",
  },
  groupMeta: {
    color: "#8ca5bb",
    fontSize: 13,
  },
  groupFixtures: {
    gap: 10,
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
  emptyCard: {
    backgroundColor: "#0b0b0b",
    borderRadius: 4,
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