import type {
  HomeNewsPlacement,
  PublicFixtureDetailResponse,
  PublicFixturesResponse,
  PublicNewsDetailResponse,
  PublicNewsResponse,
  PublicSeasonsResponse,
} from "@nsl/shared";

type FetchLike = typeof fetch;

type PublicApiClientOptions = {
  baseUrl: string;
  fetchImpl?: FetchLike;
};

type NewsQuery = {
  placement?: HomeNewsPlacement;
  limit?: number;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "");
}

function createUrl(baseUrl: string, path: string, query?: Record<string, string>) {
  const url = new URL(`${normalizeBaseUrl(baseUrl)}${path}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

async function getJson<T>(fetchImpl: FetchLike, input: string): Promise<T> {
  const response = await fetchImpl(input, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(responseText || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function createPublicApiClient(options: PublicApiClientOptions) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  return {
    getNews(query?: NewsQuery) {
      const searchParams: Record<string, string> = {};

      if (query?.placement) {
        searchParams.placement = query.placement;
      }

      if (query?.limit && query.limit > 0) {
        searchParams.limit = String(query.limit);
      }

      return getJson<PublicNewsResponse>(fetchImpl, createUrl(baseUrl, "/api/public/news", searchParams));
    },

    getNewsArticle(slug: string) {
      return getJson<PublicNewsDetailResponse>(
        fetchImpl,
        createUrl(baseUrl, `/api/public/news/${encodeURIComponent(slug)}`)
      );
    },

    getFixtures() {
      return getJson<PublicFixturesResponse>(fetchImpl, createUrl(baseUrl, "/api/public/fixtures"));
    },

    getFixture(id: string) {
      return getJson<PublicFixtureDetailResponse>(
        fetchImpl,
        createUrl(baseUrl, `/api/public/fixtures/${encodeURIComponent(id)}`)
      );
    },

    getSeasons() {
      return getJson<PublicSeasonsResponse>(fetchImpl, createUrl(baseUrl, "/api/public/seasons"));
    },
  };
}