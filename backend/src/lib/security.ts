import bcrypt from "bcrypt";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export function generateOtpCode() {
  return String(crypto.randomInt(100000, 999999));
}

export async function hashOtp(code: string) {
  return bcrypt.hash(code, BCRYPT_ROUNDS);
}

export async function verifyOtp(code: string, codeHash: string) {
  return bcrypt.compare(code, codeHash);
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

/** Stronger password rules for caregivers' accounts. */
export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Password must include a letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  return null;
}

export const OTP_TTL_MS = 15 * 60 * 1000;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_MS = 15 * 60 * 1000;
