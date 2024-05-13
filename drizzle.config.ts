import { type Config } from "drizzle-kit";

import { env } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "pg",
  out: "./src/server/db/migrations/",
  dbCredentials: {
    connectionString: env.DATABASE_URL,
  },
  tablesFilter: [""],
} satisfies Config;
