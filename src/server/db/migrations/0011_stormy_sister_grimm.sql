CREATE TABLE IF NOT EXISTS "processing_event" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid,
	"clip_id" uuid,
	"type" varchar(256) NOT NULL,
	"created_at" timestamp NOT NULL,
	"finished_at" timestamp,
	"error" text
);
