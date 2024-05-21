// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, InferModel } from "drizzle-orm";
import {
  boolean,
  pgTableCreator,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const source = createTable("source", {
  id: uuid("id").primaryKey().notNull(),
  externalId: varchar("external_id", { length: 256 }),
  name: varchar("name", { length: 256 }).notNull(),
  processing: boolean("processing").notNull(),
  url: varchar("url", { length: 256 }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});
export type Source = InferModel<typeof source>;

export const clip = createTable("clip", {
  id: uuid("id").primaryKey(),
  sourceId: uuid("source_id").references(() => source.id),
  title: varchar("title", { length: 256 }),
  url: varchar("url", { length: 256 }),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updatedAt"),
});
export type Clip = InferModel<typeof clip>;
