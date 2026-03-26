import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { FormField } from "../../components/FormField";
import { NslLogo } from "../../components/NslLogo";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";

export function LoginScreen() {
  const { login, isBootstrapping } = useAppSession();
  const [emailOrUsername, setEmailOrUsername] = useState("amir.attia@nsl.example");
  const [password, setPassword] = useState("password");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setIsSubmitting(true);

    try {
      await login({ emailOrUsername, password });
    } catch (error) {
      Alert.alert("Sign in", error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} contentContainerStyle={styles.screenFill}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardWrap}>
        <View style={styles.heroBackdrop}>
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </View>

        <View style={styles.logoWrap}>
          <NslLogo width={140} height={168} />
          <Text style={styles.brandTitle}>National Snooker League</Text>
          <Text style={styles.brandSubtitle}>Premium matchday control built for players, tournaments, and league operations.</Text>
        </View>

        <LinearGradient colors={["rgba(17, 25, 36, 0.98)", "rgba(11, 16, 24, 0.96)"]} style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>
          <Text style={styles.cardCopy}>Use the same NSL account and session cookie flow as the web app. The current terms version is accepted automatically when you sign in.</Text>

          <View style={styles.formStack}>
            <FormField label="Email or Username" value={emailOrUsername} onChangeText={setEmailOrUsername} autoCapitalize="none" />
            <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <PrimaryButton
            label={isSubmitting ? "Signing In..." : "Login"}
            onPress={handleLogin}
            disabled={isSubmitting || isBootstrapping}
            icon={<MaterialCommunityIcons name="arrow-right-circle-outline" size={18} color="#17110a" />}
          />

          <Pressable style={styles.forgotRow}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        </LinearGradient>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenFill: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: appTheme.spacing.xxl,
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: "center",
    gap: appTheme.spacing.xl,
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  glowTop: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 240,
    backgroundColor: appTheme.colors.tealGlow,
    opacity: 0.15,
    top: -70,
    right: -40,
  },
  glowBottom: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: appTheme.colors.goldSoft,
    opacity: 0.12,
    bottom: -110,
    left: -70,
  },
  logoWrap: {
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  brandSubtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 10,
  },
  card: {
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: appTheme.spacing.xl,
    gap: appTheme.spacing.lg,
    ...appTheme.shadows.card,
  },
  cardTitle: {
    color: appTheme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  cardCopy: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  formStack: {
    gap: appTheme.spacing.md,
  },
  forgotRow: {
    alignItems: "center",
  },
  forgotText: {
    color: appTheme.colors.teal,
    fontSize: 13,
    fontWeight: "700",
  },
});