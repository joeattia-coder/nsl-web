import { Pressable, StyleSheet, Text, View } from "react-native";

import { appTheme } from "../theme";

type Item = {
  key: string;
  label: string;
};

type SegmentedControlProps = {
  items: Item[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ items, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const isActive = item.key === value;

        return (
          <Pressable key={item.key} onPress={() => onChange(item.key)} style={[styles.item, isActive && styles.itemActive]}>
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    padding: 6,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 8,
  },
  item: {
    flex: 1,
    minHeight: 42,
    borderRadius: appTheme.radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  itemActive: {
    backgroundColor: appTheme.colors.surfaceRaised,
    borderWidth: 1,
    borderColor: appTheme.colors.orangeSoft,
  },
  label: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  labelActive: {
    color: appTheme.colors.orange,
  },
});