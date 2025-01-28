"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

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

export async function register(values: z.infer<typeof registerFormSchema>) {
  // TODO: Rate limit here.

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
  // TODO: Rate limit here.

  // Parse and validate the form data, even if we already do on the client,
  // since server actions are fundamentally an API endpoint.
  const { success, data, error } = loginFormSchema.safeParse(values);
  if (!success) return { message: error.issues[0].message };

  const { username, password } = data;

  const user = await getUser(username);
  const validPassword = user
    ? await verifyPassword(user.passwordHash, password)
    : false;

  // Avoid returning early here to prevent malicious actors from easily
  // discovering genuine usernames via error message or response time.

  if (!user || !validPassword) {
    return { message: "Invalid username or password." };
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  await invalidateExpiredSessions();

  return redirect("/");
}

export async function logout() {
  const { session } = await getCurrentSession();
  if (!session) return;

  await invalidateSession(session.id);
  await invalidateExpiredSessions();

  await deleteSessionTokenCookie();
}
