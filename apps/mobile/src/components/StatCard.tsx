import { StyleSheet, Text, View } from "react-native";

import type { StatTone } from "../types/app";
import { appTheme } from "../theme";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  tone?: StatTone;
};

export function StatCard({ label, value, helper, tone = "neutral" }: StatCardProps) {
  return (
    <View style={[styles.card, tone === "accent" && styles.cardAccent, tone === "gold" && styles.cardGold]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, tone === "accent" && styles.valueAccent, tone === "gold" && styles.valueGold]}>{value}</Text>
      <Text style={styles.helper}>{helper}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 122,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 10,
  },
  cardAccent: {
    borderColor: appTheme.colors.borderStrong,
  },
  cardGold: {
    borderColor: "rgba(199, 165, 91, 0.22)",
  },
  label: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  value: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  valueAccent: {
    color: appTheme.colors.teal,
  },
  valueGold: {
    color: appTheme.colors.gold,
  },
  helper: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
    lineHeight: 18,
  },
});