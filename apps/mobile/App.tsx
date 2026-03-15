import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import FixtureDetailScreen from "./app/fixture-detail";
import FixturesScreen from "./app/fixtures";
import HomeScreen from "./app/index";
import NewsDetailScreen from "./app/news-detail";
import NewsScreen from "./app/news";

type ActiveTab = "home" | "news" | "fixtures";

type ScreenState =
  | { kind: "tab"; tab: ActiveTab }
  | { kind: "news-detail"; slug: string }
  | { kind: "fixture-detail"; fixtureId: string };

const tabs: Array<{ key: ActiveTab; label: string }> = [
  { key: "home", label: "Home" },
  { key: "news", label: "News" },
  { key: "fixtures", label: "Fixtures" },
];

export default function App() {
  const [screen, setScreen] = useState<ScreenState>({ kind: "tab", tab: "home" });

  const activeTab = screen.kind === "tab" ? screen.tab : null;

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {screen.kind === "tab" && screen.tab === "home" ? (
          <HomeScreen
            onOpenNews={() => setScreen({ kind: "tab", tab: "news" })}
            onOpenFixtures={() => setScreen({ kind: "tab", tab: "fixtures" })}
            onOpenArticle={(slug) => setScreen({ kind: "news-detail", slug })}
            onOpenFixture={(fixtureId) => setScreen({ kind: "fixture-detail", fixtureId })}
          />
        ) : null}
        {screen.kind === "tab" && screen.tab === "news" ? (
          <NewsScreen onOpenArticle={(slug) => setScreen({ kind: "news-detail", slug })} />
        ) : null}
        {screen.kind === "tab" && screen.tab === "fixtures" ? (
          <FixturesScreen onOpenFixture={(fixtureId) => setScreen({ kind: "fixture-detail", fixtureId })} />
        ) : null}
        {screen.kind === "news-detail" ? (
          <NewsDetailScreen slug={screen.slug} onBack={() => setScreen({ kind: "tab", tab: "news" })} />
        ) : null}
        {screen.kind === "fixture-detail" ? (
          <FixtureDetailScreen fixtureId={screen.fixtureId} onBack={() => setScreen({ kind: "tab", tab: "fixtures" })} />
        ) : null}
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <Pressable key={tab.key} onPress={() => setScreen({ kind: "tab", tab: tab.key })} style={[styles.tabButton, isActive ? styles.tabButtonActive : null]}>
              <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#07131f",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#10243a",
    borderTopWidth: 1,
    borderTopColor: "#1c3a57",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: "#0b1d2f",
  },
  tabButtonActive: {
    backgroundColor: "#f59e0b",
  },
  tabLabel: {
    color: "#8ca5bb",
    fontSize: 13,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#07131f",
  },
});