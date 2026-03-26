import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TournamentSummary } from "../types/app";
import { appTheme } from "../theme";

type TournamentCardProps = {
  tournament: TournamentSummary;
  onPress?: () => void;
};

export function TournamentCard({ tournament, onPress }: TournamentCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.copyWrap}>
          <Text style={styles.title}>{tournament.name}</Text>
          <Text style={styles.subtitle}>{tournament.division}</Text>
        </View>
        <View style={[styles.badge, tournament.isRegistered ? styles.badgeRegistered : styles.badgeOpen]}>
          <Text style={styles.badgeText}>{tournament.status}</Text>
        </View>
      </View>
      <Text style={styles.description}>{tournament.shortDescription}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{tournament.venue}</Text>
        <Text style={styles.meta}>{tournament.dateLabel}</Text>
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.note}>{tournament.registrationNote}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={appTheme.colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 12,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  subtitle: {
    color: appTheme.colors.teal,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  badge: {
    borderRadius: appTheme.radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  badgeRegistered: {
    backgroundColor: appTheme.colors.goldSoft,
  },
  badgeOpen: {
    backgroundColor: appTheme.colors.tealSoft,
  },
  badgeText: {
    color: appTheme.colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  description: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  metaRow: {
    gap: 4,
  },
  meta: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.caption,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  note: {
    color: appTheme.colors.gold,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
  },
});