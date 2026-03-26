import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "../theme";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export function SectionHeader({ title, subtitle, actionLabel, onPressAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copyWrap}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onPressAction} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.section,
    fontWeight: "800",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.caption,
  },
  action: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: appTheme.radii.pill,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceRaised,
  },
  actionLabel: {
    color: appTheme.colors.teal,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
  },
});