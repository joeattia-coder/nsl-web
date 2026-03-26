import { StyleSheet, View } from "react-native";

import { appTheme } from "../theme";

type LoadingSkeletonProps = {
  lines?: number;
  height?: number;
};

export function LoadingSkeleton({ lines = 3, height = 14 }: LoadingSkeletonProps) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: lines }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[
            styles.line,
            {
              height,
              width: `${index === lines - 1 ? 72 : 100}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  line: {
    borderRadius: appTheme.radii.pill,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
});