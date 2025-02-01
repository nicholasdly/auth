"use server";

import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";

import {
  createVerificationRequest,
  sendVerificationEmail,
  setVerificationRequestCookie,
} from "../email";
import { generateSessionToken } from "../helpers";
import { hashPassword } from "../password";
import { authBucket } from "../ratelimit";
import { registerFormSchema } from "../schemas";
import { createSession, setSessionTokenCookie } from "../session";

export async function register(values: z.infer<typeof registerFormSchema>) {
  const headersStore = await headers();
  const ip = headersStore.get("x-forwarded-for") ?? "unknown";

  const allowed = await authBucket.consume(ip, 1);
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
