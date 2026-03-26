import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { appTheme } from "../theme";

type FormFieldProps = TextInputProps & {
  label: string;
};

export function FormField({ label, placeholderTextColor = appTheme.colors.textMuted, style, ...props }: FormFieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={placeholderTextColor} style={[styles.input, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 8,
  },
  label: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  input: {
    minHeight: 52,
    borderRadius: appTheme.radii.sm,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceRaised,
    paddingHorizontal: 16,
    color: appTheme.colors.text,
    fontSize: appTheme.typography.body,
  },
});