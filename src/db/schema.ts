import { pgTable } from "drizzle-orm/pg-core";

export const users = pgTable("users", (t) => ({
  id: t.uuid().primaryKey().defaultRandom(),
  username: t.text().notNull(),
  passwordHash: t.text().notNull(),
}));

export const sessions = pgTable("sessions", (t) => ({
  id: t.text().primaryKey(),
  userId: t
    .uuid()
    .notNull()
    .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
  expiresAt: t.timestamp({ withTimezone: true }).notNull(),
}));
