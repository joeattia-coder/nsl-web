import { StyleSheet, View } from "react-native";

import type { SnookerBall } from "../../types/scoring";
import { Ball } from "./Ball";

type BreakSequenceProps = {
  balls: SnookerBall[];
  compact?: boolean;
};

export function BreakSequence({ balls, compact = false }: BreakSequenceProps) {
  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      {balls.map((ball, index) => (
        <Ball key={`${ball}-${index}`} ball={ball} size={compact ? 15 : 16} tight />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  rowCompact: {
    gap: 2,
  },
});