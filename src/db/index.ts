import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

/**
 * Cache the database connection in development. This avoids creating a new
 * connection on every Hot Module Replacement (HMR) update.
 */
const cachedDb = globalThis as unknown as {
  connection: postgres.Sql | undefined;
};

const connection = cachedDb.connection ?? postgres(process.env.DATABASE_URL!);
const db = drizzle(connection, { schema, casing: "snake_case" });

if (process.env.NODE_ENV !== "production") {
  cachedDb.connection = connection;
}

export { db };
