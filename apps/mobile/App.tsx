import { Feather } from "@expo/vector-icons";
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

const tabs: Array<{ key: ActiveTab; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { key: "home", label: "Home", icon: "home" },
  { key: "news", label: "News", icon: "file-text" },
  { key: "fixtures", label: "Fixtures", icon: "calendar" },
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
            <Pressable key={tab.key} onPress={() => setScreen({ kind: "tab", tab: tab.key })} style={styles.tabButton}>
              <Feather
                name={tab.icon}
                size={18}
                color={isActive ? "#f59e0b" : "#8ca5bb"}
                style={styles.tabIcon}
              />
              {isActive ? <Text style={styles.tabLabel}>{tab.label}</Text> : null}
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
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#1c3a57",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 54,
    paddingVertical: 6,
  },
  tabIcon: {
    marginBottom: 1,
  },
  tabLabel: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "700",
  },
});