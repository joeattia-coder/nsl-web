import { createPublicApiClient } from "@nsl/api";
import * as Linking from "expo-linking";

import { Platform } from "react-native";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

function getExpoLanBaseUrl() {
  if (Platform.OS === "web") {
    return null;
  }

  try {
    const expoUrl = Linking.createURL("/");
    const { hostname } = new URL(expoUrl);

    if (!hostname) {
      return null;
    }

    return `http://${hostname}:3000`;
  } catch {
    return null;
  }
}

const fallbackBaseUrl =
  getExpoLanBaseUrl() ||
  (Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000");

export const apiBaseUrl = configuredBaseUrl || fallbackBaseUrl;

export const publicApi = createPublicApiClient({
  baseUrl: apiBaseUrl,
});