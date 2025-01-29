import { InferSelectModel } from "drizzle-orm";

import { sessions, users, verificationRequests } from "./schema";

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type VerificationRequest = InferSelectModel<typeof verificationRequests>;
