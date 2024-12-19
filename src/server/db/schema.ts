// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql, InferModel } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { defaultTheme } from "@/server/entities/clip/domain/Clip";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

export const company = createTable("company", {
  id: uuid("id").primaryKey().notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  email: varchar("email", { length: 256 }).notNull().unique(),
  password: varchar("password", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export type CompanyModel = InferModel<typeof company>;

export const source = createTable("source", {
  id: uuid("id").primaryKey().notNull(),
  companyId: uuid("company_id").notNull(),
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
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
});
export type SourceModel = InferModel<typeof source>;

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

export const sourceTranscription = createTable("source_transcription", {
  sourceId: uuid("source_id")
    .primaryKey()
    .references(() => source.id, { onDelete: "cascade" }),
  transcription: jsonb("transcription").notNull(),
});

export type SourceTranscription = InferModel<typeof sourceTranscription>;

export const suggestion = createTable("suggestion", {
  id: uuid("id").primaryKey(),
  companyId: uuid("company_id").notNull(),
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
export type SuggestionModel = InferModel<typeof suggestion>;

export const clip = createTable("clip", {
  id: uuid("id").primaryKey(),
  sourceId: uuid("source_id")
    .references(() => source.id, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id").notNull(),
  name: varchar("name", { length: 256 })
    .notNull()
    .default(sql`''`),
  url: varchar("url", { length: 256 }),
  processing: boolean("processing").notNull(),
  width: numeric("width").notNull(),
  height: numeric("height").notNull(),
  themeFont: varchar("theme_font", { length: 25 })
    .notNull()
    .default(defaultTheme.themeFont),
  themeFontColor: varchar("theme_font_color", { length: 25 })
    .notNull()
    .default(defaultTheme.themeFontColor),
  themeSize: integer("theme_size").notNull().default(defaultTheme.themeSize),
  themePosition: integer("theme_position")
    .notNull()
    .default(defaultTheme.themePosition),
  themeMainColor: varchar("theme_main_color", { length: 25 })
    .notNull()
    .default(defaultTheme.themeMainColor),
  themeSecondaryColor: varchar("theme_secondary_color", {
    length: 25,
  })
    .notNull()
    .default(defaultTheme.themeSecondaryColor),
  themeThirdColor: varchar("theme_third_color", { length: 25 })
    .notNull()
    .default(defaultTheme.themeThirdColor),
  themeStroke: varchar("theme_stroke", { length: 20 })
    .notNull()
    .default(defaultTheme.themeStroke),
  themeStrokeColor: varchar("theme_stroke_color", { length: 25 })
    .notNull()
    .default(defaultTheme.themeStrokeColor),
  themeShadow: varchar("theme_shadow", { length: 20 })
    .notNull()
    .default(defaultTheme.themeShadow),
  themeUpperText: boolean("theme_upper_text")
    .notNull()
    .default(defaultTheme.themeUpperText),
  themeEmoji: boolean("theme_emoji").notNull().default(defaultTheme.themeEmoji),
  themeEmojiPosition: varchar("theme_emoji_position", { length: 20 })
    .notNull()
    .default(defaultTheme.themeEmojiPosition),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).notNull(),
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
      pk: primaryKey({
        columns: [table.sectionOrder, table.clipId, table.order],
      }),
    };
  },
);
export type SectionFragment = InferModel<typeof sectionFragment>;

export const processingEvent = createTable("processing_event", {
  id: uuid("id").primaryKey(),
  sourceId: uuid("source_id").references(() => source.id, {
    onDelete: "cascade",
  }).notNull(),
  companyId: uuid("company_id").notNull(),
  clipId: uuid("clip_id").references(() => clip.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 256 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  startProcessingAt: timestamp("start_processing_at", { withTimezone: true }),
  error: text("error"),
});
