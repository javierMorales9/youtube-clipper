import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, conn } from "..";
// This will run migrations on the database, skipping the ones already applied
migrate(db, { migrationsFolder: "./drizzle" }).then(() => {
  conn.end();
});
