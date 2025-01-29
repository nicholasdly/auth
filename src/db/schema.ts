import { pgTable, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  (t) => ({
    id: t.uuid().primaryKey().defaultRandom(),
    email: t.text().notNull().unique(),
    username: t.text().notNull(),
    passwordHash: t.text().notNull(),
    createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
    verifiedAt: t.timestamp({ withTimezone: true }),
  }),
  (table) => [uniqueIndex("email_idx").on(table.email)],
);

export const sessions = pgTable("sessions", (t) => ({
  id: t.text().primaryKey(),
  userId: t
    .uuid()
    .notNull()
    .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
  createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: t.timestamp({ withTimezone: true }).notNull(),
}));

export const verificationRequests = pgTable("verification_requests", (t) => ({
  id: t.text().primaryKey(),
  userId: t
    .uuid()
    .notNull()
    .references(() => users.id, { onUpdate: "cascade", onDelete: "cascade" }),
  email: t.text().notNull(),
  code: t.text().notNull(),
  createdAt: t.timestamp({ withTimezone: true }).notNull().defaultNow(),
  expiresAt: t.timestamp({ withTimezone: true }).notNull(),
}));
