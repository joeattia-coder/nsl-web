import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "../../theme";

type FrameScoreProps = {
  leftScore: number;
  rightScore: number;
  bestOfFrames?: number;
  compact?: boolean;
};

export function FrameScore({ leftScore, rightScore, bestOfFrames, compact = false }: FrameScoreProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, compact && styles.labelCompact]}>Frames</Text>
      <Text style={[styles.value, compact && styles.valueCompact]}>{bestOfFrames ? `${leftScore} (${bestOfFrames}) ${rightScore}` : `${leftScore} - ${rightScore}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  labelCompact: {
    fontSize: 11,
  },
  value: {
    color: appTheme.colors.text,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  valueCompact: {
    fontSize: 22,
  },
});