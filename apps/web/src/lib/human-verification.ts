import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const HUMAN_VERIFICATION_TTL_MS = 1000 * 60 * 10;

type HumanVerificationPayload = {
  answer: number;
  exp: number;
};

function getSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.DATABASE_URL ??
    "development-human-verification-secret"
  );
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodePayload(payload: HumanVerificationPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encoded);
  return `${encoded}.${signature}`;
}

function decodePayload(token: string) {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encoded);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HumanVerificationPayload;

    if (
      typeof parsed.answer !== "number" ||
      !Number.isFinite(parsed.answer) ||
      typeof parsed.exp !== "number" ||
      parsed.exp <= Date.now()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createHumanVerificationChallenge() {
  const left = Math.floor(Math.random() * 9) + 1;
  const right = Math.floor(Math.random() * 9) + 1;

  return {
    prompt: `What is ${left} + ${right}?`,
    token: encodePayload({
      answer: left + right,
      exp: Date.now() + HUMAN_VERIFICATION_TTL_MS,
    }),
  };
}

export function validateHumanVerification(token: string, answer: string) {
  const parsed = decodePayload(String(token ?? "").trim());

  if (!parsed) {
    return "Human verification expired or invalid. Please try again.";
  }

  const normalizedAnswer = String(answer ?? "").trim();

  if (!/^-?\d+$/.test(normalizedAnswer)) {
    return "Human verification answer is incorrect.";
  }

  const numericAnswer = Number.parseInt(normalizedAnswer, 10);

  if (!Number.isFinite(numericAnswer) || numericAnswer !== parsed.answer) {
    return "Human verification answer is incorrect.";
  }

  return null;
}
