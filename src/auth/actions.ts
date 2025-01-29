"use server";

import { eq, or } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { Throttler } from "@/redis/throttler";
import { TokenBucket } from "@/redis/token-bucket";

import {
  createVerificationRequest,
  deleteUserVerificationRequests,
  deleteVerificationRequestCookie,
  getVerificationRequest,
  sendVerificationEmail,
  setVerificationRequestCookie,
} from "./email";
import { generateSessionToken } from "./helpers";
import { hashPassword, verifyPassword } from "./password";
import {
  loginFormSchema,
  registerFormSchema,
  verificationFormSchema,
} from "./schemas";
import {
  createSession,
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateExpiredSessions,
  invalidateSession,
  setSessionTokenCookie,
} from "./session";

// All authentication actions share the same token bucket so they can be
// globally rate limited by IP address.
const bucket = new TokenBucket("auth", 10, 1);

// The `login` action throttler for each failed attempt.
const throttler = new Throttler("login");

/**
 * A server action for registering a new user.
 * @param values Parsed values from the register form.
 */
export async function register(values: z.infer<typeof registerFormSchema>) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") ?? "unknown";

  const allowed = await bucket.consume(ip, 1);
  if (!allowed) return { message: "Slow down! You're going too fast." };

  // Parse and validate the form data, even if we already do on the client,
  // since server actions are fundamentally an API endpoint.
  const { success, data, error } = registerFormSchema.safeParse(values);
  if (!success) return { message: error.issues[0].message };

  const { username, email, password } = data;

  // TODO: Verify password strength here.

  // TODO: Verify password has not been compromised here.

  const [existingUser] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, username), eq(users.email, email)))
    .limit(1);

  if (existingUser && existingUser.username === username) {
    return { message: "An account with that username already exists." };
  } else if (existingUser && existingUser.email === email) {
    return { message: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
    })
    .returning();

  const emailVerificationRequest = await createVerificationRequest(
    user.id,
    user.email,
  );
  await sendVerificationEmail(
    emailVerificationRequest.email,
    emailVerificationRequest.code,
  );
  await setVerificationRequestCookie(emailVerificationRequest);

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  return redirect("/verify");
}

/**
 * A server action for verifying a user's email address.
 * @param values Parsed values from the email verification form.
 */
export async function verify(values: z.infer<typeof verificationFormSchema>) {
  const { user } = await getCurrentSession();

  // prettier-ignore
  if (!user) return { message: "You need to be logged in to verify your email." };
  if (user.verifiedAt) return { message: "Your email is already verified." };

  const allowed = await bucket.consume(user.id, 1);
  if (!allowed) return { message: "Slow down! You're going too fast." };

  // Parse and validate the form data, even if we already do on the client,
  // since server actions are fundamentally an API endpoint.
  const { success, data, error } = verificationFormSchema.safeParse(values);
  if (!success) return { message: error.issues[0].message };

  const code = data.code.toUpperCase();

  const cookieStore = await cookies();
  const id = cookieStore.get("email_verification")?.value;
  if (!id) return { message: "The verification code had expired." };

  let request = await getVerificationRequest(user.id, id);
  if (!request) return { message: "The verification code had expired." };

  // Send a new verification code if the first has expired.
  if (Date.now() >= request.expiresAt.getTime()) {
    request = await createVerificationRequest(request.userId, request.email);
    await setVerificationRequestCookie(request);
    await sendVerificationEmail(request.email, code);

    // prettier-ignore
    return { message: "The verification code had expired. We sent another code to your email." };
  }

  if (request.code !== code) return { message: "Incorrect verification code!" };

  await deleteUserVerificationRequests(request.userId);

  // TODO: Invalidate password reset sessions here.

  await db
    .update(users)
    .set({ verifiedAt: new Date() })
    .where(eq(users.id, request.userId));

  await deleteVerificationRequestCookie();

  return redirect("/");
}

/**
 * A server action for logging in a user.
 * @param values Parsed values from the login form.
 */
export async function login(values: z.infer<typeof loginFormSchema>) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") ?? "unknown";

  const allowed = await bucket.consume(ip, 1);
  if (!allowed) return { message: "Slow down! You're going too fast." };

  // Parse and validate the form data, even if we already do on the client,
  // since server actions are fundamentally an API endpoint.
  const { success, data, error } = loginFormSchema.safeParse(values);
  if (!success) return { message: error.issues[0].message };

  const { identifier, password } = data;

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.username, identifier), eq(users.email, identifier)))
    .limit(1);

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

/**
 * A server action for logging out a user.
 */
export async function logout() {
  const { session } = await getCurrentSession();
  if (!session) return { message: "Unable to logout! Try reloading the page." };

  await invalidateSession(session.id);
  await invalidateExpiredSessions();
  await deleteSessionTokenCookie();

  return redirect("/");
}
