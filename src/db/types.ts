import { InferSelectModel } from "drizzle-orm";

import { sessions, users } from "./schema";

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
