import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: [".env", ".env.local"] });

const connection = postgres(process.env.DATABASE_URL!, {
  max: 1,
  onnotice: () => {},
});

const db = drizzle(connection);

async function main() {
  console.log("⏳ Running migrations...");

  migrate(db, { migrationsFolder: "./src/db/migrations/" })
    .then(() => console.log("✅ Database migrations completed!"))
    .catch((error) => {
      console.error("❌ Error occurred during migration:", error);
    })
    .finally(async () => await connection.end());
}

main();
