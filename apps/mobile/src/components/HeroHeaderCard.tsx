import type { ReactNode } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "../theme";
import { Avatar } from "./Avatar";

type HeroHeaderCardProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  initials: string;
  badge?: string;
  tone?: "default" | "gold";
  children?: ReactNode;
};

export function HeroHeaderCard({ eyebrow, title, subtitle, initials, badge, tone = "default", children }: HeroHeaderCardProps) {
  return (
    <LinearGradient colors={["#111924", "#0a1018"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.glow} />
      <View style={styles.topRow}>
        <View style={styles.copyWrap}>
          <Text style={styles.eyebrow}>{eyebrow}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.avatarWrap}>
          <Avatar initials={initials} size={66} tone={tone} />
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
      </View>
      {children ? <View style={styles.childrenWrap}>{children}</View> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appTheme.radii.lg,
    padding: appTheme.spacing.xl,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    overflow: "hidden",
    gap: appTheme.spacing.lg,
    ...appTheme.shadows.card,
  },
  glow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: appTheme.colors.tealGlow,
    opacity: 0.14,
    right: -70,
    top: -90,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: appTheme.spacing.md,
  },
  copyWrap: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    color: appTheme.colors.teal,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.hero,
    fontWeight: "900",
    lineHeight: 34,
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 22,
  },
  avatarWrap: {
    alignItems: "center",
    gap: 10,
  },
  badge: {
    color: appTheme.colors.gold,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
  },
  childrenWrap: {
    gap: appTheme.spacing.md,
  },
});