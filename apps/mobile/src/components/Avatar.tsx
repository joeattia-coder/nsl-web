import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

import { appTheme } from "../theme";

type AvatarProps = {
  initials: string;
  size?: number;
  tone?: "default" | "gold";
  style?: StyleProp<ViewStyle>;
  photoUrl?: string | null;
  imageStyle?: StyleProp<ImageStyle>;
};

export function Avatar({ initials, size = 52, tone = "default", style, photoUrl, imageStyle }: AvatarProps) {
  const hasPhoto = Boolean(photoUrl?.trim());

  return (
    <View
      style={[
        styles.avatar,
        tone === "gold" ? styles.avatarGold : styles.avatarDefault,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      {hasPhoto ? (
        <Image source={{ uri: photoUrl!.trim() }} style={[styles.image, { borderRadius: size / 2 }, imageStyle]} resizeMode="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  avatarDefault: {
    backgroundColor: appTheme.colors.tealSoft,
    borderColor: appTheme.colors.borderStrong,
  },
  avatarGold: {
    backgroundColor: appTheme.colors.goldSoft,
    borderColor: "rgba(199, 165, 91, 0.35)",
  },
  initials: {
    color: appTheme.colors.text,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});