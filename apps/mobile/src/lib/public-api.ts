import { createPublicApiClient } from "@nsl/api";

export const apiBaseUrl = "https://nsl-web.vercel.app";

if (__DEV__) {
  console.log(`[mobile-api] using base URL: ${apiBaseUrl}`);
}

export const publicApi = createPublicApiClient({
  baseUrl: apiBaseUrl,
});