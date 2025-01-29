import "server-only";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { verificationRequests } from "@/db/schema";
import { VerificationRequest } from "@/db/types";

import { generateSessionToken, generateVerificationCode } from "./helpers";

// Verification requests will expire after 15 minutes.
const requestDuration = 1000 * 60 * 15;

export async function getVerificationRequest(
  userId: string,
  id: string,
): Promise<VerificationRequest | null> {
  const [request] = await db
    .select()
    .from(verificationRequests)
    .where(
      and(
        eq(verificationRequests.id, id),
        eq(verificationRequests.userId, userId),
      ),
    )
    .limit(1);

  return request ?? null;
}

export async function createVerificationRequest(userId: string, email: string) {
  await deleteUserVerificationRequests(userId);

  const id = generateSessionToken(); // Re-using session token logic.
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + requestDuration);

  const [request] = await db
    .insert(verificationRequests)
    .values({
      id,
      userId,
      email,
      code,
      expiresAt,
    })
    .returning();

  return request;
}

export async function deleteUserVerificationRequests(userId: string) {
  await db
    .delete(verificationRequests)
    .where(eq(verificationRequests.userId, userId));
}

export async function sendVerificationEmail(email: string, code: string) {
  // TODO: Replace with your email service (ex. Resend).
  console.log(`To ${email}: Your verification code is ${code}`);
}

export async function setVerificationRequestCookie(
  request: VerificationRequest,
) {
  const cookiesStore = await cookies();
  cookiesStore.set("email_verification", request.id, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: request.expiresAt,
  });
}

export async function deleteVerificationRequestCookie() {
  const cookiesStore = await cookies();
  cookiesStore.set("email_verification", "", {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
  });
}
