import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

export function createOpaqueToken(byteLength = 32) {
  return randomBytes(byteLength).toString("base64url");
}

export function hashOpaqueToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createExpiryDate(ttlMs: number) {
  return new Date(Date.now() + ttlMs);
}