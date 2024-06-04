CREATE TABLE IF NOT EXISTS "clip" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid,
	"url" varchar(256),
	"processing" boolean NOT NULL,
	"created_at" timestamp,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clip_range" (
	"clip_id" uuid,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	CONSTRAINT "clip_range_clip_id_start_end_pk" PRIMARY KEY("clip_id","start","end")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clip_section" (
	"number" integer,
	"clip_id" uuid,
	"start" integer NOT NULL,
	"end" integer NOT NULL,
	"display" varchar(256),
	CONSTRAINT "clip_section_number_clip_id_pk" PRIMARY KEY("number","clip_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "section_fragment" (
	"section_order" integer,
	"clip_id" uuid,
	"x" integer NOT NULL,
	"y" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "section_fragment_section_order_clip_id_pk" PRIMARY KEY("section_order","clip_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "source" (
	"id" uuid PRIMARY KEY NOT NULL,
	"external_id" varchar(256),
	"name" varchar(256) NOT NULL,
	"processing" boolean DEFAULT false NOT NULL,
	"url" varchar(256),
	"width" integer,
	"height" integer,
	"created_at" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip" ADD CONSTRAINT "clip_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "source"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip_range" ADD CONSTRAINT "clip_range_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "clip"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip_section" ADD CONSTRAINT "clip_section_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "clip"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "clip"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
