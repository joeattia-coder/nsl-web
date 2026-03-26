import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { appTheme } from "../theme";

type ScreenContainerProps = {
  children: React.ReactNode;
  scrollable?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({ children, scrollable = true, contentContainerStyle }: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={[styles.glow, styles.glowLeft]} />
      <View style={[styles.glow, styles.glowRight]} />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        {scrollable ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, contentContainerStyle]}>
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, styles.scrollContent, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: appTheme.spacing.lg,
    paddingTop: appTheme.spacing.lg,
    paddingBottom: 132,
    gap: appTheme.spacing.lg,
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 260,
    opacity: 0.08,
  },
  glowLeft: {
    backgroundColor: appTheme.colors.tealGlow,
    top: -80,
    left: -110,
  },
  glowRight: {
    backgroundColor: appTheme.colors.goldSoft,
    top: 140,
    right: -120,
  },
});