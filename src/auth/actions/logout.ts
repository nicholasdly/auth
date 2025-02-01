"use server";

import { redirect } from "next/navigation";

import {
  deleteSessionTokenCookie,
  getCurrentSession,
  invalidateExpiredSessions,
  invalidateSession,
} from "../session";

export async function logout() {
  const { session } = await getCurrentSession();
  if (!session) return { message: "Unable to logout! Try reloading the page." };

  await invalidateSession(session.id);
  await invalidateExpiredSessions();
  await deleteSessionTokenCookie();

  return redirect("/");
}
