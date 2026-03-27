import { StyleSheet, View } from "react-native";

import type { SnookerBall } from "../../types/scoring";
import { Ball } from "./Ball";
import { snookerBallMeta } from "./ball-config";

type BallSelectorProps = {
  balls: SnookerBall[];
  onSelect: (ball: SnookerBall) => void;
  activeBall?: SnookerBall | null;
  disabledBalls?: SnookerBall[];
  compact?: boolean;
  singleRow?: boolean;
};

export function BallSelector({ balls, onSelect, activeBall = null, disabledBalls = [], compact = false, singleRow = false }: BallSelectorProps) {
  const size = compact ? 46 : 58;

  return (
    <View style={[styles.row, compact && styles.rowCompact, singleRow && styles.singleRow]}>
      {balls.map((ball) => (
        <Ball
          key={ball}
          ball={ball}
          size={size}
          active={activeBall === ball}
          disabled={disabledBalls.includes(ball)}
          onPress={() => onSelect(ball)}
          accessibilityLabel={`Pot ${snookerBallMeta[ball].label}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  rowCompact: {
    gap: 8,
  },
  singleRow: {
    flexWrap: "nowrap",
    justifyContent: "space-between",
  },
});