CREATE TABLE IF NOT EXISTS "clip" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid,
	"title" varchar(256),
	"url" varchar(256),
	"created_at" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source" (
	"id" uuid PRIMARY KEY NOT NULL,
	"external_id" varchar(256),
	"name" varchar(256),
	"url" varchar(256),
	"created_at" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip" ADD CONSTRAINT "clip_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
