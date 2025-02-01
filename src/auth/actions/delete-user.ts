"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";

import { getCurrentSession } from "../session";

export async function deleteUser() {
  const { user } = await getCurrentSession();
  // prettier-ignore
  if (!user) return { message: "Unable to delete account! Try reloading the page." };

  await db.delete(users).where(eq(users.id, user.id));

  return redirect("/");
}
