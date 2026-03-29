import { createPublicApiClient } from "@nsl/api";

export const apiBaseUrl = "https://dev.nsl-tv.com";

if (__DEV__) {
  console.log(`[mobile-api] using base URL: ${apiBaseUrl}`);
}

export const publicApi = createPublicApiClient({
  baseUrl: apiBaseUrl,
});