import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "../theme";

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: "solid" | "ghost";
  disabled?: boolean;
  icon?: React.ReactNode;
};

export function PrimaryButton({ label, onPress, variant = "solid", disabled = false, icon }: PrimaryButtonProps) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, variant === "solid" ? styles.solid : styles.ghost, disabled && styles.disabled]}>
      <View style={styles.content}>
        {icon}
        <Text style={[styles.label, variant === "solid" ? styles.solidText : styles.ghostText]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: appTheme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  solid: {
    backgroundColor: appTheme.colors.gold,
  },
  ghost: {
    backgroundColor: appTheme.colors.tealSoft,
    borderWidth: 1,
    borderColor: appTheme.colors.borderStrong,
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "900",
  },
  solidText: {
    color: "#17110a",
  },
  ghostText: {
    color: appTheme.colors.text,
  },
});