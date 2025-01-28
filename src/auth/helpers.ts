import "server-only";

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
