import { NextResponse } from "next/server";
import {
  buildAdminSessionCookieValue,
  getAdminSessionCookieName,
  getAdminSessionCookieOptions,
} from "@/lib/admin-auth";
import { completeSocialAuth, type SocialAuthMode, type SocialProviderKey } from "@/lib/social-auth";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

function isSocialProvider(value: string): value is SocialProviderKey {
  return value === "google" || value === "facebook";
}

function buildAuthRedirect(request: Request, error: string, mode: SocialAuthMode = "login") {
  const url = new URL(mode === "register" ? "/register" : "/login", request.url);
  url.searchParams.set("error", error);
  return url;
}

export async function GET(request: Request, context: RouteContext) {
  const { provider } = await context.params;

  if (!isSocialProvider(provider)) {
    return NextResponse.redirect(buildAuthRedirect(request, "social_provider_invalid"));
  }

  try {
    const result = await completeSocialAuth(provider, request);

    if (!result.ok) {
      return NextResponse.redirect(buildAuthRedirect(request, result.error, result.authMode));
    }

    const redirectUrl = new URL(result.nextPath, request.url);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(
      getAdminSessionCookieName(),
      buildAdminSessionCookieValue(result.userId),
      getAdminSessionCookieOptions()
    );
    return response;
  } catch (error) {
    console.error(`GET /api/auth/oauth/${provider}/callback error:`, error);
    return NextResponse.redirect(buildAuthRedirect(request, "social_auth_failed"));
  }
}