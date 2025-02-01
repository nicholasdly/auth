"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";

import {
  createVerificationRequest,
  deleteUserVerificationRequests,
  deleteVerificationRequestCookie,
  getVerificationRequest,
  sendVerificationEmail,
  setVerificationRequestCookie,
} from "../email";
import { authBucket } from "../ratelimit";
import { verificationFormSchema } from "../schemas";
import { getCurrentSession } from "../session";

export async function verifyEmail(
  values: z.infer<typeof verificationFormSchema>,
) {
  const { user } = await getCurrentSession();

  // prettier-ignore
  if (!user) return { message: "You need to be logged in to verify your email." };
  if (user.verifiedAt) return { message: "Your email is already verified." };

  const allowed = await authBucket.consume(user.id, 1);
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
