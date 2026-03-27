import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "../../theme";

type MainScoreProps = {
  leftPoints: number;
  rightPoints: number;
  compact?: boolean;
};

export function MainScore({ leftPoints, rightPoints, compact = false }: MainScoreProps) {
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, compact && styles.labelCompact]}>Current Frame</Text>
      <Text style={[styles.value, compact && styles.valueCompact]}>{leftPoints} - {rightPoints}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  labelCompact: {
    fontSize: 11,
  },
  value: {
    color: appTheme.colors.text,
    fontSize: 64,
    fontWeight: "900",
    letterSpacing: 2,
    textAlign: "center",
  },
  valueCompact: {
    fontSize: 48,
  },
});