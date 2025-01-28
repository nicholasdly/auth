import "server-only";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { cache } from "react";

import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import type { Session, User } from "@/db/types";
import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";

import { generateRandomBytes } from "./helpers";

// Sessions will expire after 7 days.
// Be sure this aligns in the middleware too!
const sessionDuration = 1000 * 60 * 60 * 24 * 7;

export type SessionValidationResult =
  | { session: Session; user: User }
  | { session: null; user: null };

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

/**
 * Creates a new session in the database for a specified user given a session
 * token.
 * @param token The session token.
 * @param userId The user ID.
 * @returns The new session.
 */
export async function createSession(token: string, userId: string) {
  // The session ID will be the SHA-256 hash of the token. SHA-256 is a one-way
  // hash function. This ensures that even if the database contents were
  // leaked, the attacker won't be able to retrieve valid tokens.
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const session: Session = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + sessionDuration),
  };
  await db.insert(sessions).values(session);

  return session;
}

/**
 * Validates a specified session token, verifying it is associated with an
 * active user and session. Will extend the session expiration date if
 * @param token
 * @returns If the session token is valid, returns the session and user object.
 * Otherwise, returns `null` for both.
 */
export async function validateSessionToken(
  token: string,
): Promise<SessionValidationResult> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

  const result = await db.transaction(async (tx) => {
    const [{ users: user, sessions: session }] = await tx
      .select()
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, sessionId));

    // Does the session exist in our database?
    if (!user || !session) return { session: null, user: null };

    // Is the session still within expiration?
    if (Date.now() >= session.expiresAt.getTime()) {
      await tx.delete(sessions).where(eq(sessions.id, session.id));
      return { session: null, user: null };
    }

    // Extend the session expiration when it's close to expiration (halflife).
    if (Date.now() >= session.expiresAt.getTime() - sessionDuration / 2) {
      session.expiresAt = new Date(Date.now() + sessionDuration);
      await tx
        .update(sessions)
        .set({ expiresAt: session.expiresAt })
        .where(eq(sessions.id, session.id));
    }

    return { session, user };
  });

  return result;
}

/**
 * Invalidates a specified session by deleting it from the database.
 * @param sessionId The session ID.
 */
export async function invalidateSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/**
 * Sets the session token cookie in the browser.
 * @param token The session token.
 * @param expiresAt The expiration date of the cookie.
 */
export async function setSessionTokenCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Deletes the session token cookie from the browser.
 */
export async function deleteSessionTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Retrieves the current session, including the user object, from the database.
 * The result is cached so it can be called multiple times without incurring
 * multiple database calls.
 */
export const getCurrentSession = cache(
  async (): Promise<SessionValidationResult> => {
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value ?? null;

    if (token === null) return { session: null, user: null };

    const result = await validateSessionToken(token);
    return result;
  },
);
