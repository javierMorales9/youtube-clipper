// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, InferModel } from "drizzle-orm";
import {
  boolean,
  numeric,
  integer,
  pgTableCreator,
  primaryKey,
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
  url: varchar("url", { length: 256 }),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updatedAt"),
});
export type Clip = InferModel<typeof clip>;

export const clipRange = createTable(
  "clip_range",
  {
    clipId: uuid("clip_id").references(() => clip.id),
    start: numeric("start").notNull(),
    end: numeric("end").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.clipId, table.start, table.end] }),
    };
  },
);
export type ClipRange = InferModel<typeof clipRange>;

export const clipSection = createTable("clip_section", {
  order: integer("number").primaryKey(),
  clipId: uuid("clip_id").references(() => clip.id),
  start: numeric("start").notNull(),
  end: numeric("end").notNull(),
  display: varchar("display", { length: 256 }),
});
export type ClipSection = InferModel<typeof clipSection>;

export const sectionFragment = createTable("section_fragment", {
  sectionId: integer("section_id").references(() => clipSection.order),
  x: numeric("x").notNull(),
  y: numeric("y").notNull(),
  width: numeric("width").notNull(),
  height: numeric("height").notNull(),
});
export type SectionFragment = InferModel<typeof sectionFragment>;
