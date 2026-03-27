import Svg, { Circle, ClipPath, Defs, G, Rect, Text as SvgText } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "../../theme";

type CompositeFoulBallProps = {
  size?: number;
  label?: string;
};

export function CompositeFoulBall({ size = 62, label = "4" }: CompositeFoulBallProps) {
  const radius = size / 2;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id="compositeBallClip">
            <Circle cx={radius} cy={radius} r={radius - 1} />
          </ClipPath>
        </Defs>
        <G clipPath="url(#compositeBallClip)">
          <Rect x="0" y="0" width={radius} height={radius} fill="#d83f58" />
          <Rect x={radius} y="0" width={radius} height={radius} fill="#dcb536" />
          <Rect x="0" y={radius} width={radius} height={radius} fill="#2ca36e" />
          <Rect x={radius} y={radius} width={radius} height={radius} fill="#8f5c36" />
        </G>
        <Circle cx={radius} cy={radius} r={radius - 1} fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
        <Circle cx={radius} cy={radius} r={radius * 0.3} fill="rgba(8, 10, 14, 0.72)" />
        <SvgText x={radius} y={radius + 5} fontSize={size * 0.3} fontWeight="700" fill="#f5f7fa" textAnchor="middle">
          {label}
        </SvgText>
      </Svg>
      <View pointerEvents="none" style={[styles.highlight, { width: size * 0.28, height: size * 0.28, borderRadius: size * 0.14, top: size * 0.12, left: size * 0.18 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
    shadowColor: "rgba(0, 0, 0, 0.7)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  highlight: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.34)",
  },
});