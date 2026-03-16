import { NextResponse } from "next/server";
import { beginSocialAuth, type SocialProviderKey } from "@/lib/social-auth";

type RouteContext = {
  params: Promise<{
    provider: string;
  }>;
};

function isSocialProvider(value: string): value is SocialProviderKey {
  return value === "google" || value === "facebook";
}

export async function GET(request: Request, context: RouteContext) {
  const { provider } = await context.params;

  if (!isSocialProvider(provider)) {
    return NextResponse.json({ error: "Unsupported provider." }, { status: 404 });
  }

  const result = await beginSocialAuth(provider, request);
  return NextResponse.redirect(result.redirectUrl);
}