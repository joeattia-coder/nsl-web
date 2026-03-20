import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;

const MIN_PASSWORD_LENGTH = 10;

function toHex(buffer: Buffer) {
  return buffer.toString("hex");
}

export function validatePasswordStrength(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use a password that is at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z\d]/.test(password);

  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
    return "Use at least one uppercase letter, one lowercase letter, one number, and one symbol.";
  }

  return null;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH);
  return `scrypt:${toHex(salt)}:${toHex(derivedKey as Buffer)}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [scheme, saltHex, hashHex] = storedHash.split(":");

  if (scheme !== "scrypt" || !saltHex || !hashHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}