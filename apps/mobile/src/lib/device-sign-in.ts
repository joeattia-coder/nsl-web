import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const DEVICE_SIGN_IN_STORAGE_KEY = "nsl.mobile.device-sign-in";

type StoredDeviceCredentials = {
  identifier: string;
  password: string;
  savedAt: string;
};

export type DeviceSignInStatus = {
  isSupported: boolean;
  isEnrolled: boolean;
  hasCredentials: boolean;
};

async function readStoredCredentials() {
  const storedValue = await SecureStore.getItemAsync(DEVICE_SIGN_IN_STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as StoredDeviceCredentials;
  } catch {
    await SecureStore.deleteItemAsync(DEVICE_SIGN_IN_STORAGE_KEY);
    return null;
  }
}

function mapPromptError(error: string | undefined) {
  if (error === "user_cancel" || error === "system_cancel" || error === "app_cancel") {
    return "Device sign-in was cancelled.";
  }

  if (error === "not_enrolled") {
    return "No biometric or device credential is enrolled on this device yet.";
  }

  if (error === "lockout") {
    return "Device authentication is temporarily locked. Use your password sign-in for now.";
  }

  return "Device sign-in could not be completed.";
}

export const deviceSignIn = {
  async getStatus(): Promise<DeviceSignInStatus> {
    const [hasHardware, isEnrolled, storedCredentials] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      readStoredCredentials(),
    ]);

    return {
      isSupported: hasHardware,
      isEnrolled,
      hasCredentials: Boolean(storedCredentials),
    };
  },

  async storeCredentials(identifier: string, password: string) {
    await SecureStore.setItemAsync(
      DEVICE_SIGN_IN_STORAGE_KEY,
      JSON.stringify({
        identifier,
        password,
        savedAt: new Date().toISOString(),
      } satisfies StoredDeviceCredentials)
    );
  },

  async clearCredentials() {
    await SecureStore.deleteItemAsync(DEVICE_SIGN_IN_STORAGE_KEY);
  },

  async getCredentialsWithPrompt() {
    const storedCredentials = await readStoredCredentials();

    if (!storedCredentials) {
      throw new Error("Device sign-in is not set up on this device yet.");
    }

    const authenticationResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Sign in to NSL Mobile",
      promptDescription: "Use Face ID, fingerprint, or your device credential to continue.",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
    });

    if (!authenticationResult.success) {
      throw new Error(mapPromptError(authenticationResult.error));
    }

    return storedCredentials;
  },
};