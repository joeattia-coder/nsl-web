import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { appTheme } from "../theme";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
};

export function EmptyState({ title, description, icon = "magnify" }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={icon} size={22} color={appTheme.colors.teal} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: appTheme.spacing.xl,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appTheme.colors.tealSoft,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.section,
    fontWeight: "800",
  },
  description: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    textAlign: "center",
    lineHeight: 20,
  },
});