"use server";

import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";

import { generateSessionToken } from "../helpers";
import { verifyPassword } from "../password";
import { authBucket, loginThrottler } from "../ratelimit";
import { loginFormSchema } from "../schemas";
import {
  createSession,
  invalidateExpiredSessions,
  setSessionTokenCookie,
} from "../session";

export async function login(values: z.infer<typeof loginFormSchema>) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") ?? "unknown";

  const allowed = await authBucket.consume(ip, 1);
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
    return await loginThrottler.consume(ip)
      ? { message: "Invalid username or password." }
      : { message: "You're blocked from logging in due to repeated failed attempts. Please come back later." };
  } else {
    await loginThrottler.reset(ip);
  }

  const sessionToken = generateSessionToken();
  const session = await createSession(sessionToken, user.id);
  await setSessionTokenCookie(sessionToken, session.expiresAt);

  await invalidateExpiredSessions();

  return redirect("/");
}
