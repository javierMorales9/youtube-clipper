// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, InferModel } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgTableCreator,
  primaryKey,
  text,
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
  externalId: varchar("external_id", { length: 256 }).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  processing: boolean("processing")
    .notNull()
    .default(sql`false`),
  url: varchar("url", { length: 256 }),
  width: integer("width"),
  height: integer("height"),
  duration: numeric("duration").$type<number>(),
  genre: varchar("genre", { length: 256 }),
  clipLength: varchar("clip_length", { length: 256 }),
  processingRangeStart: integer("processing_range_start"),
  processingRangeEnd: integer("processing_range_end"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});
export type Source = InferModel<typeof source>;

export const sourceTag = createTable(
  "source_tag",
  {
    sourceId: uuid("source_id")
      .references(() => source.id, { onDelete: "cascade" })
      .notNull(),
    tag: varchar("tag", { length: 256 }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.sourceId, table.tag] }),
    };
  },
);
export type SourceTag = InferModel<typeof sourceTag>;

export const suggestion = createTable("suggestion", {
  id: uuid("id").primaryKey(),
  sourceId: uuid("source_id")
    .references(() => source.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 256 })
    .notNull()
    .default(sql`''`),
  description: text("description"),
  start: integer("start").notNull(),
  end: integer("end").notNull(),
});

export const clip = createTable("clip", {
  id: uuid("id").primaryKey(),
  sourceId: uuid("source_id")
    .references(() => source.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 256 })
    .notNull()
    .default(sql`''`),
  url: varchar("url", { length: 256 }),
  processing: boolean("processing").notNull(),
  width: numeric("width").notNull(),
  height: numeric("height").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updatedAt"),
});
export type ClipTable = InferModel<typeof clip>;

export const clipRange = createTable(
  "clip_range",
  {
    clipId: uuid("clip_id")
      .references(() => clip.id, { onDelete: "cascade" })
      .notNull(),
    start: integer("start").notNull(),
    end: integer("end").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.clipId, table.start, table.end] }),
    };
  },
);
export type ClipRange = InferModel<typeof clipRange>;

export const clipSection = createTable(
  "clip_section",
  {
    order: integer("number").notNull(),
    clipId: uuid("clip_id")
      .references(() => clip.id, { onDelete: "cascade" })
      .notNull(),
    start: integer("start").notNull(),
    end: integer("end").notNull(),
    display: varchar("display", { length: 256 }).notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.order, table.clipId] }),
    };
  },
);
export type ClipSection = InferModel<typeof clipSection>;

export const sectionFragment = createTable(
  "section_fragment",
  {
    order: integer("order").default(0).notNull(),
    sectionOrder: integer("section_order").notNull(),
    clipId: uuid("clip_id")
      .references(() => clip.id, { onDelete: "cascade" })
      .notNull(),
    x: integer("x").notNull(),
    y: integer("y").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.sectionOrder, table.clipId, table.order] }),
    };
  },
);
export type SectionFragment = InferModel<typeof sectionFragment>;

export const processingEvent = createTable("processing_event", {
  id: uuid("id").primaryKey(),
  sourceId: uuid("source_id").references(() => source.id, {
    onDelete: "cascade",
  }),
  clipId: uuid("clip_id").references(() => clip.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 256 }).notNull(),
  createdAt: timestamp("created_at").notNull(),
  finishedAt: timestamp("finished_at"),
  error: text("error"),
});
