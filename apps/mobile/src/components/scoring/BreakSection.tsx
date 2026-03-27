import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "../../theme";
import type { SnookerBall } from "../../types/scoring";
import { snookerBallMeta } from "./ball-config";
import { BreakSequence } from "./BreakSequence";

type BreakSectionProps = {
  breakValue: number;
  sequence: SnookerBall[];
  compact?: boolean;
};

export function BreakSection({ breakValue, sequence, compact = false }: BreakSectionProps) {
  return (
    <LinearGradient colors={["rgba(20, 28, 39, 0.96)", "rgba(10, 14, 20, 0.98)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, compact && styles.titleCompact]}>Break: {breakValue}</Text>
      </View>
      {sequence.length > 0 ? <BreakSequence balls={sequence} compact={compact} /> : <Text style={styles.placeholder}>No balls potted in this break yet.</Text>}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    gap: 16,
    ...appTheme.shadows.card,
  },
  cardCompact: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  titleCompact: {
    fontSize: 18,
  },
  placeholder: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
});