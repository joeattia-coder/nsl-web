import { useEffect, useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Avatar } from "../../components/Avatar";
import { EmptyState } from "../../components/EmptyState";
import { FormField } from "../../components/FormField";
import { LoadingSkeleton } from "../../components/LoadingSkeleton";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { SectionHeader } from "../../components/SectionHeader";
import { SegmentedControl } from "../../components/SegmentedControl";
import { mobileApi } from "../../lib/mobile-api";
import { useAppSession } from "../../state/app-session";
import { appTheme } from "../../theme";
import type { UserRole, UserProfile } from "../../types/app";

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { availableRoles, currentRole, currentUser, refreshSession, switchRole, logout, deviceSignInStatus, disableDeviceSignIn } = useAppSession();
  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    middleInitial: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    stateProvince: "",
    postalCode: "",
    country: "",
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleItems = availableRoles.map((role) => ({
    key: role,
    label: role === "league_admin" ? "Admin" : role === "tournament_manager" ? "Manager" : "Player",
  }));

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await mobileApi.getProfile();

        if (!isMounted) {
          return;
        }

        setProfile({
          firstName: response.player.firstName,
          lastName: response.player.lastName,
          middleInitial: response.player.middleInitial ?? "",
          dateOfBirth: response.player.dateOfBirth ? response.player.dateOfBirth.slice(0, 10) : "",
          email: response.player.emailAddress ?? "",
          phone: response.player.phoneNumber ?? "",
          addressLine1: response.player.addressLine1 ?? "",
          addressLine2: response.player.addressLine2 ?? "",
          city: response.player.city ?? "",
          stateProvince: response.player.stateProvince ?? "",
          postalCode: response.player.postalCode ?? "",
          country: response.player.country ?? "",
        });
        setProfilePhotoUrl(response.player.photoUrl ?? null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load the profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateField = <Key extends keyof UserProfile>(key: Key, value: UserProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await mobileApi.updateProfile({
        firstName: profile.firstName,
        middleInitial: profile.middleInitial || null,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth || null,
        emailAddress: profile.email || null,
        phoneNumber: profile.phone || null,
        photoUrl: profilePhotoUrl,
        addressLine1: profile.addressLine1 || null,
        addressLine2: profile.addressLine2 || null,
        city: profile.city || null,
        stateProvince: profile.stateProvince || null,
        country: profile.country || null,
        postalCode: profile.postalCode || null,
      });
      await refreshSession();
      Alert.alert("Profile", "Profile details updated successfully.");
    } catch (saveError) {
      Alert.alert("Profile", saveError instanceof Error ? saveError.message : "Unable to save the profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (signOutError) {
      Alert.alert("Sign Out", signOutError instanceof Error ? signOutError.message : "Unable to sign out.");
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.profileHero}>
        <Avatar initials={currentUser.initials} photoUrl={profilePhotoUrl} size={74} tone="gold" />
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{currentUser.fullName}</Text>
          <Text style={styles.email}>{currentUser.email}</Text>
          <Text style={styles.subtitle}>{currentUser.subtitle}</Text>
        </View>
      </View>

      {isLoading ? <LoadingSkeleton lines={4} height={16} /> : null}
      {error ? <EmptyState title="Profile unavailable" description={error} icon="alert-circle-outline" /> : null}

      <View style={styles.photoPanel}>
        <SectionHeader title="Player Photo" subtitle="The live profile endpoint already exposes the current photo URL." />
        <View style={styles.photoPlaceholder}>
          {profilePhotoUrl ? (
            <Image source={{ uri: profilePhotoUrl }} style={styles.profilePhotoPreview} resizeMode="cover" />
          ) : (
            <Text style={styles.photoText}>No player photo uploaded yet.</Text>
          )}
        </View>
      </View>

      {roleItems.length > 1 ? (
        <View style={styles.panel}>
          <SectionHeader title="Role View" subtitle="Switch between the personal player shell and the authenticated admin shell available to this account." />
          <SegmentedControl items={roleItems} value={currentRole} onChange={(value) => switchRole(value as UserRole)} />
        </View>
      ) : null}

      {deviceSignInStatus.isSupported ? (
        <View style={styles.panel}>
          <SectionHeader
            title="Device Sign-In"
            subtitle={deviceSignInStatus.hasCredentials ? "This device can use a native authentication prompt before replaying your saved NSL credentials." : "After a password sign-in, you can enable Face ID, fingerprint, or device PIN convenience login on this device."}
          />
          {deviceSignInStatus.hasCredentials ? (
            <PrimaryButton
              label="Forget This Device Sign-In"
              variant="ghost"
              onPress={() => {
                Alert.alert("Device Sign-In", "Remove saved sign-in credentials from this device?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                      void disableDeviceSignIn().catch((error) => {
                        Alert.alert("Device Sign-In", error instanceof Error ? error.message : "Unable to remove device sign-in.");
                      });
                    },
                  },
                ]);
              }}
            />
          ) : (
            <Text style={styles.deviceCopy}>Sign in from the public login screen with your password to enroll this device.</Text>
          )}
        </View>
      ) : null}

      <View style={styles.panel}>
        <SectionHeader title="Profile Details" subtitle="Editable player identity and contact info." />
        <View style={styles.formGrid}>
          <FormField label="First Name" value={profile.firstName} onChangeText={(value) => updateField("firstName", value)} />
          <FormField label="Last Name" value={profile.lastName} onChangeText={(value) => updateField("lastName", value)} />
          <FormField label="Middle Initial" value={profile.middleInitial} onChangeText={(value) => updateField("middleInitial", value)} />
          <FormField label="Date of Birth" value={profile.dateOfBirth} onChangeText={(value) => updateField("dateOfBirth", value)} />
          <FormField label="Email" value={profile.email} onChangeText={(value) => updateField("email", value)} autoCapitalize="none" />
          <FormField label="Phone" value={profile.phone} onChangeText={(value) => updateField("phone", value)} keyboardType="phone-pad" />
          <FormField label="Address Line 1" value={profile.addressLine1} onChangeText={(value) => updateField("addressLine1", value)} />
          <FormField label="Address Line 2" value={profile.addressLine2} onChangeText={(value) => updateField("addressLine2", value)} />
          <FormField label="City" value={profile.city} onChangeText={(value) => updateField("city", value)} />
          <FormField label="State / Province" value={profile.stateProvince} onChangeText={(value) => updateField("stateProvince", value)} />
          <FormField label="Postal Code" value={profile.postalCode} onChangeText={(value) => updateField("postalCode", value)} />
          <FormField label="Country" value={profile.country} onChangeText={(value) => updateField("country", value)} />
        </View>

        <View style={styles.actionStack}>
          <PrimaryButton label={isSaving ? "Saving Profile..." : "Save Profile"} onPress={handleSave} disabled={isSaving || isLoading || Boolean(error)} />
          <PrimaryButton label="Change Password" variant="ghost" onPress={() => navigation.navigate("ChangePassword")} />
          <PrimaryButton label="Sign Out" variant="ghost" onPress={handleSignOut} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileHero: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
    alignItems: "center",
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  profileCopy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: appTheme.colors.text,
    fontSize: 22,
    fontWeight: "900",
  },
  email: {
    color: appTheme.colors.gold,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
  },
  subtitle: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  photoPanel: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: 12,
  },
  photoPlaceholder: {
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderStyle: "dashed",
    backgroundColor: appTheme.colors.surfaceStrong,
  },
  photoText: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
  },
  profilePhotoPreview: {
    width: "100%",
    minHeight: 220,
    borderRadius: appTheme.radii.md,
  },
  panel: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: appTheme.spacing.lg,
  },
  formGrid: {
    gap: appTheme.spacing.md,
  },
  actionStack: {
    gap: 12,
  },
  deviceCopy: {
    color: appTheme.colors.textMuted,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
});