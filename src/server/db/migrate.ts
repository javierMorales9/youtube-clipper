import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, conn } from './index';

await migrate(db, { migrationsFolder: './src/server/db/migrations' });
await conn.end();

