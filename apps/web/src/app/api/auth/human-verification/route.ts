import { NextResponse } from "next/server";
import { createHumanVerificationChallenge } from "@/lib/human-verification";

export async function GET() {
  const challenge = createHumanVerificationChallenge();
  return NextResponse.json({ ok: true, challenge });
}
