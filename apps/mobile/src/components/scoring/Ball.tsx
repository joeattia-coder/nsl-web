import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

import { appTheme } from "../../theme";
import type { SnookerBall } from "../../types/scoring";
import { snookerBallMeta } from "./ball-config";

type BallProps = {
  ball: SnookerBall;
  size?: number;
  onPress?: () => void;
  active?: boolean;
  disabled?: boolean;
  tight?: boolean;
  accessibilityLabel?: string;
};

export function Ball({ ball, size = 58, onPress, active = false, disabled = false, tight = false, accessibilityLabel }: BallProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const palette = snookerBallMeta[ball];
  const touchSize = onPress ? size + 16 : tight ? size : size + 16;

  const animateScale = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      tension: 220,
      friction: 16,
      useNativeDriver: true,
    }).start();
  };

  const ballNode = (
    <Animated.View
      style={[
        styles.ballWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ scale }],
          shadowColor: palette.shadow,
        },
        active && styles.ballWrapActive,
        disabled && styles.ballWrapDisabled,
      ]}
    >
      <LinearGradient colors={palette.gradient} start={{ x: 0.22, y: 0.14 }} end={{ x: 0.82, y: 0.9 }} style={styles.gradientFill}>
        <LinearGradient
          colors={["rgba(255,255,255,0.68)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0)"]}
          start={{ x: 0.18, y: 0.16 }}
          end={{ x: 0.88, y: 0.88 }}
          style={[styles.highlightGradient, { width: size * 0.46, height: size * 0.46, borderRadius: size * 0.23, top: size * 0.1, left: size * 0.1 }]}
        />
        {disabled ? <View style={styles.disabledVeil} /> : null}
      </LinearGradient>
    </Animated.View>
  );

  if (!onPress) {
    return <View style={[styles.touchTarget, { width: touchSize, height: touchSize }]}>{ballNode}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? palette.label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      onPressIn={() => animateScale(0.94)}
      onPressOut={() => animateScale(1)}
      style={[styles.touchTarget, { width: touchSize, height: touchSize }]}
    >
      {ballNode}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchTarget: {
    alignItems: "center",
    justifyContent: "center",
  },
  ballWrap: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.26)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 12,
  },
  ballWrapActive: {
    borderColor: appTheme.colors.gold,
    shadowOpacity: 0.62,
    shadowRadius: 24,
    elevation: 16,
  },
  gradientFill: {
    flex: 1,
  },
  highlightGradient: {
    position: "absolute",
  },
  ballWrapDisabled: {
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowOpacity: 0.24,
    elevation: 8,
  },
  disabledVeil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 12, 18, 0.18)",
  },
});