import { Pressable, StyleSheet, Text, View } from "react-native";

import { Avatar } from "../Avatar";
import { appTheme } from "../../theme";

type PlayerHeaderProps = {
  name: string;
  initials: string;
  photoUrl?: string | null;
  active: boolean;
  onPress: () => void;
  align: "left" | "right";
  compact?: boolean;
};

export function PlayerHeader({ name, initials, photoUrl, active, onPress, align, compact = false }: PlayerHeaderProps) {
  const avatarSize = compact ? 60 : 72;

  return (
    <View style={[styles.container, align === "left" ? styles.alignLeft : styles.alignRight]}>
      <Pressable onPress={onPress} style={styles.avatarWrap} accessibilityRole="button" accessibilityLabel={`Set ${name} active`}>
        <Avatar initials={initials} photoUrl={photoUrl} size={avatarSize} style={[styles.avatar, active && styles.avatarActive]} />
        {active ? <View style={[styles.activeDot, align === "left" ? styles.activeDotLeft : styles.activeDotRight]} /> : null}
      </Pressable>
      <Text numberOfLines={2} style={[styles.name, compact && styles.nameCompact, align === "left" ? styles.textLeft : styles.textRight]}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 108,
    gap: 10,
  },
  alignLeft: {
    alignItems: "flex-start",
  },
  alignRight: {
    alignItems: "flex-end",
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    backgroundColor: appTheme.colors.surfaceRaised,
  },
  avatarActive: {
    borderColor: "rgba(255, 255, 255, 0.26)",
  },
  activeDot: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ff3b3b",
    borderWidth: 2,
    borderColor: appTheme.colors.background,
    top: 2,
  },
  activeDotLeft: {
    right: -1,
  },
  activeDotRight: {
    left: -1,
  },
  name: {
    color: appTheme.colors.text,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  nameCompact: {
    fontSize: 13,
    lineHeight: 17,
  },
  textLeft: {
    textAlign: "left",
  },
  textRight: {
    textAlign: "right",
  },
});