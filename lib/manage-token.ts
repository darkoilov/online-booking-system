/**
 * Manage Token Utility
 *
 * Generates a random token for client manage-booking links.
 * Stores a SHA-256 hash in the DB (manageTokenHash field on Booking).
 * The raw token is sent to the client via email / shown on success screen.
 */

import { randomBytes, createHash } from "crypto";

/**
 * Generate a new manage token (raw + hash pair).
 * raw: sent to client (in URL)
 * hash: stored in DB for lookup
 */
export function generateManageToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex"); // 64-char hex string
  const hash = hashToken(raw);
  return { raw, hash };
}

/**
 * Hash a raw token for comparison / lookup.
 */
export function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
