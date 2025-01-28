"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Throttler } from "@/redis/throttler";
import { TokenBucket } from "@/redis/token-bucket";

import { generateSessionToken } from "./helpers";
import { verifyPassword } from "./password";
import { loginFormSchema, registerFormSchema } from "./schemas";
import {
  createSession,
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateExpiredSessions,
  invalidateSession,
  setSessionTokenCookie,
} from "./session";
import { createUser, getUser } from "./user";

// All authentication actions share the same token bucket so they can be
// globally rate limited by IP address.
const bucket = new TokenBucket("auth", 10, 1);

// The `login` action throttler for each failed attempt.
const throttler = new Throttler("login");

export async function register(values: z.infer<typeof registerFormSchema>) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") ?? "unknown";

  const allowed = await bucket.consume(ip, 1);
  if (!allowed) return { message: "Slow down! You're going too fast." };

  // Parse and validate the form data, even if we already do on the client,
  // since server actions are fundamentally an API endpoint.
  const { success, data, error } = registerFormSchema.safeParse(values);
  if (!success) return { message: error.issues[0].message };

  const { username, password } = data;

  // TODO: Verify password strength here.

  // TODO: Verify password has not been compromised here.

  const existingUser = await getUser(username);
  if (existingUser) {
    return { message: "An account with that username already exists." };
  }

  const user = await createUser(username, password);

  // TODO: Create email verification request here.

  // TODO: Send verification email here.

  // TODO: Set email verification request cookie here.

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return redirect("/");
}

export async function login(values: z.infer<typeof loginFormSchema>) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") ?? "unknown";

  const allowed = await bucket.consume(ip, 1);
  if (!allowed) return { message: "Slow down! You're going too fast." };

  // Parse and validate the form data, even if we already do on the client,
  // since server actions are fundamentally an API endpoint.
  const { success, data, error } = loginFormSchema.safeParse(values);
  if (!success) return { message: error.issues[0].message };

  const { username, password } = data;

  const user = await getUser(username);

  // Avoid returning at early here to prevent malicious actors from easily
  // discovering genuine usernames via error message or response time.

  const validPassword = user
    ? await verifyPassword(user.passwordHash, password)
    : false;

  if (!user || !validPassword) {
    // prettier-ignore
    return await throttler.consume(ip)
      ? { message: "Invalid username or password." }
      : { message: "You're blocked from logging in due to repeated failed attempts. Please come back later." };
  } else {
    await throttler.reset(ip);
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  await invalidateExpiredSessions();

  return redirect("/");
}

export async function logout() {
  const { session } = await getCurrentSession();
  if (!session) return { message: "Unable to logout! Try reloading the page." };

  await invalidateSession(session.id);
  await invalidateExpiredSessions();
  await deleteSessionTokenCookie();

  return redirect("/");
}
