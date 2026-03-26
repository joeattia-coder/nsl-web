import { StyleSheet, Text, View } from "react-native";

import type { MatchStatus } from "../types/app";
import { appTheme } from "../theme";

type StatusPillProps = {
  status: MatchStatus;
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <View
      style={[
        styles.pill,
        status === "Scheduled" && styles.scheduled,
        status === "Completed" && styles.completed,
        status === "In Progress" && styles.inProgress,
      ]}
    >
      <Text style={styles.label}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: appTheme.radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  scheduled: {
    backgroundColor: appTheme.colors.tealSoft,
  },
  completed: {
    backgroundColor: "rgba(47, 184, 121, 0.18)",
  },
  inProgress: {
    backgroundColor: "rgba(239, 159, 63, 0.18)",
  },
  label: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.caption,
    fontWeight: "800",
  },
});