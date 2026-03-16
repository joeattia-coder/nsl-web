import "server-only";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export type SocialProviderKey = "google" | "facebook";
type DatabaseAuthProvider = "GOOGLE" | "FACEBOOK";

const OAUTH_STATE_MAX_AGE = 60 * 10;

type SocialProfile = {
  provider: DatabaseAuthProvider;
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
};

type ProviderConfig = {
  provider: DatabaseAuthProvider;
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scopes: string[];
};

function getProviderConfig(provider: SocialProviderKey): ProviderConfig | null {
  if (provider === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      return null;
    }

    return {
      provider: "GOOGLE",
      clientId,
      clientSecret,
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scopes: ["openid", "email", "profile"],
    };
  }

  const clientId = process.env.FACEBOOK_CLIENT_ID?.trim();
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    provider: "FACEBOOK",
    clientId,
    clientSecret,
    authorizationUrl: "https://www.facebook.com/v23.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v23.0/oauth/access_token",
    userInfoUrl: "https://graph.facebook.com/me?fields=id,name,email",
    scopes: ["email", "public_profile"],
  };
}

function getCookieName(provider: SocialProviderKey) {
  return `nsl_oauth_state_${provider}`;
}

function normalizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath || !nextPath.startsWith("/")) {
    return "/admin";
  }

  return nextPath;
}

function getRequestOrigin(request: Request) {
  const explicitOrigin =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_ORIGIN;

  if (explicitOrigin) {
    return explicitOrigin.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  return new URL(request.url).origin;
}

function buildCallbackUrl(provider: SocialProviderKey, request: Request) {
  return `${getRequestOrigin(request)}/api/auth/oauth/${provider}/callback`;
}

function buildStatePayload(nextPath: string) {
  return Buffer.from(
    JSON.stringify({
      nonce: randomBytes(24).toString("base64url"),
      nextPath,
    })
  ).toString("base64url");
}

function parseStatePayload(payload: string | undefined) {
  if (!payload) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      nonce?: string;
      nextPath?: string;
    };

    if (!parsed.nonce) {
      return null;
    }

    return {
      nonce: parsed.nonce,
      nextPath: normalizeNextPath(parsed.nextPath),
    };
  } catch {
    return null;
  }
}

async function exchangeCodeForTokens(
  config: ProviderConfig,
  provider: SocialProviderKey,
  request: Request,
  code: string
) {
  const redirectUri = buildCallbackUrl(provider, request);

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { access_token?: string }
    | null;

  if (!response.ok || !payload?.access_token) {
    throw new Error(`Failed to exchange ${provider} authorization code.`);
  }

  return payload.access_token;
}

async function loadSocialProfile(
  provider: SocialProviderKey,
  request: Request,
  code: string
): Promise<SocialProfile> {
  const config = getProviderConfig(provider);

  if (!config) {
    throw new Error(`${provider} login is not configured.`);
  }

  const accessToken = await exchangeCodeForTokens(config, provider, request, code);

  const response = await fetch(config.userInfoUrl, {
    headers:
      provider === "google"
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!response.ok || !payload) {
    throw new Error(`Failed to load ${provider} profile.`);
  }

  if (provider === "google") {
    return {
      provider: "GOOGLE",
      providerAccountId: String(payload.sub ?? ""),
      email: typeof payload.email === "string" ? payload.email : null,
      emailVerified: Boolean(payload.email_verified),
      displayName: typeof payload.name === "string" ? payload.name : null,
    };
  }

  return {
    provider: "FACEBOOK",
    providerAccountId: String(payload.id ?? ""),
    email: typeof payload.email === "string" ? payload.email : null,
    emailVerified: true,
    displayName: typeof payload.name === "string" ? payload.name : null,
  };
}

function getAdminUserWhere() {
  return {
    OR: [
      {
        roleAssignments: {
          some: {
            scopeType: "GLOBAL" as const,
            scopeId: "",
            role: { roleKey: "ADMINISTRATOR" },
          },
        },
      },
      {
        userRoles: {
          some: {
            role: { roleKey: "ADMINISTRATOR" },
          },
        },
      },
    ],
  };
}

export async function beginSocialAuth(provider: SocialProviderKey, request: Request) {
  const config = getProviderConfig(provider);

  if (!config) {
    return {
      ok: false as const,
      redirectUrl: new URL("/login?error=social_not_configured", request.url),
    };
  }

  const requestUrl = new URL(request.url);
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));
  const state = buildStatePayload(nextPath);
  const redirectUri = buildCallbackUrl(provider, request);
  const authUrl = new URL(config.authorizationUrl);

  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", config.scopes.join(" "));
  authUrl.searchParams.set("state", state);

  if (provider === "google") {
    authUrl.searchParams.set("prompt", "select_account");
  }

  const cookieStore = await cookies();
  cookieStore.set(getCookieName(provider), state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OAUTH_STATE_MAX_AGE,
  });

  return {
    ok: true as const,
    redirectUrl: authUrl,
  };
}

export async function completeSocialAuth(provider: SocialProviderKey, request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const returnedState = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const cookieName = getCookieName(provider);
  const storedState = cookieStore.get(cookieName)?.value;
  cookieStore.delete(cookieName);

  const parsedState = parseStatePayload(storedState);

  if (!code || !returnedState || !storedState || returnedState !== storedState || !parsedState) {
    return {
      ok: false as const,
      error: "social_state_invalid",
      nextPath: "/admin",
    };
  }

  const profile = await loadSocialProfile(provider, request, code);

  if (!profile.providerAccountId) {
    return {
      ok: false as const,
      error: "social_profile_invalid",
      nextPath: parsedState.nextPath,
    };
  }

  const existingLinkedUser = await prisma.user.findFirst({
    where: {
      AND: [
        { isLoginEnabled: true },
        getAdminUserWhere(),
        {
          authAccounts: {
            some: {
              provider: profile.provider,
              providerAccountId: profile.providerAccountId,
            },
          },
        },
      ],
    },
    select: { id: true },
  });

  let userId = existingLinkedUser?.id ?? null;

  if (!userId && profile.email) {
    const normalizedEmail = profile.email.toLowerCase();
    const matchedUser = await prisma.user.findFirst({
      where: {
        AND: [
          { isLoginEnabled: true },
          getAdminUserWhere(),
          {
            OR: [
              { email: normalizedEmail },
              { normalizedEmail },
            ],
          },
        ],
      },
      select: { id: true },
    });

    userId = matchedUser?.id ?? null;

    if (userId) {
      await prisma.authAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
          },
        },
        update: {
          userId,
          providerEmail: profile.email,
          providerEmailNormalized: normalizedEmail,
        },
        create: {
          userId,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          providerEmail: profile.email,
          providerEmailNormalized: normalizedEmail,
        },
      });
    }
  }

  if (!userId) {
    return {
      ok: false as const,
      error: "social_no_admin_account",
      nextPath: parsedState.nextPath,
    };
  }

  return {
    ok: true as const,
    nextPath: parsedState.nextPath,
    userId,
  };
}