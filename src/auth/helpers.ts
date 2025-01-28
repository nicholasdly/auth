import "server-only";

import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

/**
 * Generate a cryptographically secure random byte array of a specified length.
 * @param length The length of the byte array.
 * @returns The byte array.
 */
export function generateRandomBytes(length: number = 20): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Generates a new, random session token.
 * @returns A session token.
 */
export function generateSessionToken() {
  // The session token should NOT be a random string. Instead, we generate at
  // least 20 random bytes from a secure source. We could use UUID v4 here,
  // but the RFC does not mandate that UUIDs are generated using a secure
  // random source.
  const bytes = generateRandomBytes();

  // We can use any encoding scheme, but base32 is case insensitive and only
  // uses alphanumeric letters while being more compact than hex encoding.
  const token = encodeBase32LowerCaseNoPadding(bytes);

  return token;
}
