import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "../../theme";

type ControlTone = "neutral" | "danger" | "emphasis" | "active";

export type ControlAction = {
  key: string;
  label: string;
  tone?: ControlTone;
  onPress: () => void;
};

type ControlsRowProps = {
  actions: ControlAction[];
  compact?: boolean;
};

export function ControlsRow({ actions, compact = false }: ControlsRowProps) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <Pressable key={action.key} onPress={action.onPress} style={[styles.button, compact && styles.buttonCompact, toneStyles[action.tone ?? "neutral"].button]}>
          <Text style={[styles.label, compact && styles.labelCompact, toneStyles[action.tone ?? "neutral"].label]}>{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const toneStyles = {
  neutral: StyleSheet.create({
    button: {
      backgroundColor: "rgba(20, 28, 39, 0.92)",
      borderColor: appTheme.colors.border,
    },
    label: {
      color: appTheme.colors.text,
    },
  }),
  danger: StyleSheet.create({
    button: {
      backgroundColor: "rgba(121, 24, 36, 0.92)",
      borderColor: "rgba(240, 93, 108, 0.42)",
    },
    label: {
      color: "#ffd7db",
    },
  }),
  emphasis: StyleSheet.create({
    button: {
      backgroundColor: "rgba(199, 165, 91, 0.2)",
      borderColor: "rgba(199, 165, 91, 0.38)",
    },
    label: {
      color: appTheme.colors.gold,
    },
  }),
  active: StyleSheet.create({
    button: {
      backgroundColor: appTheme.colors.tealSoft,
      borderColor: appTheme.colors.borderStrong,
    },
    label: {
      color: appTheme.colors.text,
    },
  }),
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  buttonCompact: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  labelCompact: {
    fontSize: 11,
  },
});