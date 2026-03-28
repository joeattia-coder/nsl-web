import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { FormField } from "../../components/FormField";
import { NslLogo } from "../../components/NslLogo";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ScreenContainer } from "../../components/ScreenContainer";
import { mobileApi } from "../../lib/mobile-api";
import { appTheme } from "../../theme";
import type { RootStackParamList } from "../../types/app";

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,30}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 10;

type RegisterFieldName =
  | "firstName"
  | "lastName"
  | "country"
  | "email"
  | "username"
  | "password"
  | "confirmPassword"
  | "verificationAnswer";

type RegisterScreenProps = {
  route?: { params?: RootStackParamList["Register"] };
};

type AvailabilityState = {
  status: "idle" | "checking" | "available" | "duplicate";
  message: string | null;
};

type RegisterFieldErrors = Partial<Record<RegisterFieldName, string>>;

function normalizeMiddleInitial(value: string) {
  return value.replace(/[^a-z]/gi, "").slice(0, 1).toUpperCase();
}

function validatePasswordStrength(password: string) {
  if (!password.trim()) {
    return "Password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password that is at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z\d]/.test(password);

  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
    return "Use at least one uppercase letter, one lowercase letter, one number, and one symbol.";
  }

  return null;
}

function validateFields(values: {
  firstName: string;
  lastName: string;
  country: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  verificationAnswer: string;
}) {
  const errors: RegisterFieldErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "First name is required.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Last name is required.";
  }

  if (!values.country.trim()) {
    errors.country = "Country is required.";
  }

  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.username.trim()) {
    errors.username = "Username is required.";
  } else if (!USERNAME_PATTERN.test(values.username.trim())) {
    errors.username = "Username must be 3-30 characters and can only include letters, numbers, periods, underscores, and hyphens.";
  }

  const passwordError = validatePasswordStrength(values.password);

  if (passwordError) {
    errors.password = passwordError;
  }

  if (!values.confirmPassword.trim()) {
    errors.confirmPassword = "Confirm password is required.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "The password confirmation does not match.";
  }

  if (!values.verificationAnswer.trim()) {
    errors.verificationAnswer = "Human verification is required.";
  }

  return errors;
}

function FieldMessage({ message, tone = "danger" }: { message: string | null; tone?: "danger" | "success" | "muted" }) {
  if (!message) {
    return null;
  }

  return <Text style={[styles.fieldMessage, tone === "danger" ? styles.fieldMessageDanger : tone === "success" ? styles.fieldMessageSuccess : styles.fieldMessageMuted]}>{message}</Text>;
}

export function RegisterScreen({ route }: RegisterScreenProps) {
  const navigation = useNavigation<any>();
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationPrompt, setVerificationPrompt] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingChallenge, setIsLoadingChallenge] = useState(true);
  const [emailAvailability, setEmailAvailability] = useState<AvailabilityState>({ status: "idle", message: null });
  const [usernameAvailability, setUsernameAvailability] = useState<AvailabilityState>({ status: "idle", message: null });

  useEffect(() => {
    const prefillIdentifier = route?.params?.prefillIdentifier?.trim();

    if (!prefillIdentifier) {
      return;
    }

    if (prefillIdentifier.includes("@")) {
      setEmail(prefillIdentifier);
      return;
    }

    setUsername(prefillIdentifier);
  }, [route?.params?.prefillIdentifier]);

  const loadChallenge = async () => {
    setIsLoadingChallenge(true);
    setError(null);

    try {
      const response = await mobileApi.getHumanVerificationChallenge();
      setVerificationPrompt(response.challenge.prompt);
      setVerificationToken(response.challenge.token);
    } catch (challengeError) {
      setVerificationPrompt("");
      setVerificationToken("");
      setError(challengeError instanceof Error ? challengeError.message : "Failed to load human verification.");
    } finally {
      setIsLoadingChallenge(false);
    }
  };

  useEffect(() => {
    void loadChallenge();
  }, []);

  const passwordHint = useMemo(() => validatePasswordStrength(password), [password]);

  const checkAvailability = async (field: "email" | "username", value: string) => {
    const trimmedValue = value.trim();

    if (field === "email") {
      if (!trimmedValue || !EMAIL_PATTERN.test(trimmedValue)) {
        setEmailAvailability({ status: "idle", message: null });
        return;
      }

      setEmailAvailability({ status: "checking", message: "Checking email availability..." });

      try {
        const response = await mobileApi.getRegistrationAvailability("email", trimmedValue);
        setEmailAvailability({
          status: response.duplicate ? "duplicate" : "available",
          message: response.duplicate ? "An account with this email address already exists." : "Email address is available.",
        });
      } catch (availabilityError) {
        setEmailAvailability({
          status: "idle",
          message: availabilityError instanceof Error ? availabilityError.message : null,
        });
      }

      return;
    }

    if (!trimmedValue || !USERNAME_PATTERN.test(trimmedValue)) {
      setUsernameAvailability({ status: "idle", message: null });
      return;
    }

    setUsernameAvailability({ status: "checking", message: "Checking username availability..." });

    try {
      const response = await mobileApi.getRegistrationAvailability("username", trimmedValue);
      setUsernameAvailability({
        status: response.duplicate ? "duplicate" : "available",
        message: response.duplicate ? "That username is already in use." : "Username is available.",
      });
    } catch (availabilityError) {
      setUsernameAvailability({
        status: "idle",
        message: availabilityError instanceof Error ? availabilityError.message : null,
      });
    }
  };

  const handleSubmit = async () => {
    setError(null);

    const nextErrors = validateFields({
      firstName,
      lastName,
      country,
      email,
      username,
      password,
      confirmPassword,
      verificationAnswer,
    });

    if (emailAvailability.status === "duplicate") {
      nextErrors.email = "An account with this email address already exists. Try signing in instead.";
    }

    if (usernameAvailability.status === "duplicate") {
      nextErrors.username = "That username is already in use. Choose another username.";
    }

    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!verificationToken) {
      setError("Human verification is not ready yet. Refresh the challenge and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await mobileApi.register({
        firstName: firstName.trim(),
        middleInitial: normalizeMiddleInitial(middleInitial),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country.trim(),
        email: email.trim(),
        username: username.trim(),
        password,
        verificationToken,
        verificationAnswer: verificationAnswer.trim(),
        website: "",
      });

      const buttons = response.verificationLink
        ? [
            {
              text: "Open verification link",
              onPress: () => {
                void Linking.openURL(response.verificationLink ?? "");
                navigation.navigate("Login", { prefillIdentifier: email.trim() });
              },
            },
            {
              text: "Go to Login",
              onPress: () => navigation.navigate("Login", { prefillIdentifier: email.trim() || username.trim() }),
            },
          ]
        : [
            {
              text: "Go to Login",
              onPress: () => navigation.navigate("Login", { prefillIdentifier: email.trim() || username.trim() }),
            },
          ];

      Alert.alert("Registration submitted", response.message, buttons);
    } catch (submitError) {
      const field = (submitError as Error & { field?: string }).field;
      const message = submitError instanceof Error ? submitError.message : "Registration failed.";

      if (field === "email") {
        setFieldErrors((current) => ({ ...current, email: message }));
      } else if (field === "username") {
        setFieldErrors((current) => ({ ...current, username: message }));
      } else {
        setError(message);
      }

      await loadChallenge();
      setVerificationAnswer("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.screenFill}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardWrap}>
        <View style={styles.logoWrap}>
          <NslLogo width={102} height={122} />
          <Text style={styles.brandTitle}>Create Your NSL Account</Text>
          <Text style={styles.brandSubtitle}>This mobile registration uses the same account creation, availability, and human verification flow as the web app.</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

          <View style={styles.formStack}>
            <FormField label="First Name" value={firstName} onChangeText={setFirstName} />
            <FieldMessage message={fieldErrors.firstName ?? null} />

            <FormField label="Middle Initial (Optional)" value={middleInitial} onChangeText={(value) => setMiddleInitial(normalizeMiddleInitial(value))} autoCapitalize="characters" maxLength={1} />

            <FormField label="Last Name" value={lastName} onChangeText={setLastName} />
            <FieldMessage message={fieldErrors.lastName ?? null} />

            <FormField label="Phone Number (Optional)" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

            <FormField label="Country" value={country} onChangeText={setCountry} />
            <FieldMessage message={fieldErrors.country ?? null} />

            <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" onBlur={() => void checkAvailability("email", email)} />
            <FieldMessage message={fieldErrors.email ?? emailAvailability.message} tone={fieldErrors.email || emailAvailability.status === "duplicate" ? "danger" : emailAvailability.status === "available" ? "success" : "muted"} />

            <FormField label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" onBlur={() => void checkAvailability("username", username)} />
            <FieldMessage message={fieldErrors.username ?? usernameAvailability.message} tone={fieldErrors.username || usernameAvailability.status === "duplicate" ? "danger" : usernameAvailability.status === "available" ? "success" : "muted"} />

            <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <FieldMessage message={fieldErrors.password ?? passwordHint} tone={fieldErrors.password || passwordHint ? "danger" : "muted"} />

            <FormField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <FieldMessage message={fieldErrors.confirmPassword ?? null} />

            <View style={styles.challengeCard}>
              <Text style={styles.challengeLabel}>Human Verification</Text>
              <Text style={styles.challengePrompt}>{isLoadingChallenge ? "Loading challenge..." : verificationPrompt || "Challenge unavailable. Refresh and try again."}</Text>
              <PrimaryButton label={isLoadingChallenge ? "Refreshing..." : "Refresh Challenge"} variant="ghost" onPress={() => void loadChallenge()} disabled={isLoadingChallenge} />
            </View>

            <FormField label="Verification Answer" value={verificationAnswer} onChangeText={setVerificationAnswer} autoCapitalize="none" />
            <FieldMessage message={fieldErrors.verificationAnswer ?? null} />
          </View>

          <View style={styles.actionStack}>
            <PrimaryButton label={isSubmitting ? "Submitting Registration..." : "Create Account"} onPress={handleSubmit} disabled={isSubmitting || isLoadingChallenge} />
            <PrimaryButton label="Back to Login" variant="ghost" onPress={() => navigation.navigate("Login", { prefillIdentifier: email.trim() || username.trim() || undefined })} />
            <Pressable style={styles.linkRow} onPress={() => navigation.navigate("PublicHome")}>
              <Text style={styles.linkText}>Back to public home</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenFill: {
    paddingBottom: appTheme.spacing.xxl,
  },
  keyboardWrap: {
    gap: appTheme.spacing.lg,
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
  },
  card: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    gap: appTheme.spacing.lg,
    ...appTheme.shadows.card,
  },
  formStack: {
    gap: 10,
  },
  fieldMessage: {
    fontSize: 12,
    lineHeight: 18,
  },
  fieldMessageDanger: {
    color: appTheme.colors.danger,
  },
  fieldMessageSuccess: {
    color: appTheme.colors.success,
  },
  fieldMessageMuted: {
    color: appTheme.colors.textMuted,
  },
  challengeCard: {
    padding: appTheme.spacing.md,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surfaceStrong,
    gap: 10,
  },
  challengeLabel: {
    color: appTheme.colors.textSoft,
    fontSize: appTheme.typography.caption,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  challengePrompt: {
    color: appTheme.colors.text,
    fontSize: appTheme.typography.body,
    lineHeight: 21,
  },
  errorBanner: {
    color: appTheme.colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  actionStack: {
    gap: 12,
  },
  linkRow: {
    alignItems: "center",
  },
  linkText: {
    color: appTheme.colors.teal,
    fontSize: 13,
    fontWeight: "700",
  },
});