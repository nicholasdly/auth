import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { User } from "@/db/types";

import { hashPassword } from "./password";

export async function getUser(username: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  return user ?? null;
}

export async function createUser(
  username: string,
  password: string,
): Promise<User> {
  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(users)
    .values({
      username,
      passwordHash,
    })
    .returning();

  return user;
}
