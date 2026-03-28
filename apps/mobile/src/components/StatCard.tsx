import { StyleSheet, Text, View } from "react-native";

import type { StatTone } from "../types/app";
import { appTheme } from "../theme";

type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
  tone?: StatTone;
  compact?: boolean;
};

export function StatCard({ label, value, helper, tone = "neutral", compact = false }: StatCardProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact, tone === "accent" && styles.cardAccent, tone === "gold" && styles.cardGold]}>
      <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
      <Text style={[styles.value, compact && styles.valueCompact, tone === "accent" && styles.valueAccent, tone === "gold" && styles.valueGold]}>{value}</Text>
      {helper ? <Text style={[styles.helper, compact && styles.helperCompact]}>{helper}</Text> : null}
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
  cardCompact: {
    minHeight: 88,
    padding: 12,
    gap: 6,
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
  labelCompact: {
    fontSize: 10,
  },
  value: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  valueCompact: {
    fontSize: 21,
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
  helperCompact: {
    fontSize: 10,
    lineHeight: 14,
  },
});