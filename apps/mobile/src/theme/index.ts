import { DarkTheme, type Theme as NavigationTheme } from "@react-navigation/native";

const colors = {
  background: "#030507",
  backgroundElevated: "#081017",
  surface: "#10161d",
  surfaceStrong: "#151e27",
  surfaceRaised: "#1a232e",
  surfaceOverlay: "rgba(9, 15, 22, 0.78)",
  tabBarTop: "#030507",
  tabBarBottom: "#44484f",
  text: "#f5f7fa",
  textMuted: "#94a3b8",
  textSoft: "#cfd7e3",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "rgba(125, 211, 252, 0.22)",
  teal: "#46d1d1",
  tealSoft: "rgba(70, 209, 209, 0.18)",
  tealGlow: "rgba(75, 198, 212, 0.32)",
  gold: "#c7a55b",
  goldSoft: "rgba(199, 165, 91, 0.18)",
  orange: "#ef9f3f",
  orangeSoft: "rgba(239, 159, 63, 0.2)",
  success: "#2fb879",
  danger: "#f05d6c",
  warning: "#ef9f3f",
  shadow: "rgba(0, 0, 0, 0.52)",
};

const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const radii = {
  sm: 6,
  md: 8,
  lg: 8,
  pill: 999,
};

const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
    elevation: 12,
  },
  soft: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
};

const typography = {
  hero: 28,
  heading: 22,
  section: 17,
  body: 14,
  caption: 12,
};

const navigation: NavigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    border: "transparent",
    primary: colors.teal,
    text: colors.text,
    notification: colors.gold,
  },
};

export const appTheme = {
  colors,
  spacing,
  radii,
  shadows,
  typography,
  navigation,
};