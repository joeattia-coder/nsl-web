import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { FormField } from "../../components/FormField";
import { PrimaryButton } from "../../components/PrimaryButton";
import { mobileApi } from "../../lib/mobile-api";
import { appTheme } from "../../theme";

export function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Change Password", "Complete all password fields to continue.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Change Password", "The new password confirmation does not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await mobileApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Change Password", "Password updated successfully.");
    } catch (error) {
      Alert.alert("Change Password", error instanceof Error ? error.message : "Unable to update the password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <PrimaryButton label="Back" variant="ghost" onPress={() => navigation.goBack()} icon={<MaterialCommunityIcons name="arrow-left" size={18} color={appTheme.colors.text} />} />
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.copy}>This calls the live auth endpoint and enforces the server password policy used by the web app.</Text>
          <View style={styles.formStack}>
            <FormField label="Current Password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <FormField label="New Password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <FormField label="Confirm New Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          </View>
          <PrimaryButton label={isSubmitting ? "Saving Password..." : "Save Password"} onPress={handleSave} disabled={isSubmitting} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.xxl,
  },
  headerRow: {
    alignItems: "flex-start",
  },
  card: {
    padding: appTheme.spacing.xl,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: appTheme.spacing.lg,
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  copy: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  formStack: {
    gap: appTheme.spacing.md,
  },
});