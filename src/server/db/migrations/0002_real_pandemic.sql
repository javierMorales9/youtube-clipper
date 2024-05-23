CREATE TABLE IF NOT EXISTS "clip_range" (
	"clip_id" uuid,
	"start" numeric NOT NULL,
	"end" numeric NOT NULL,
	"created_at" timestamp,
	"updatedAt" timestamp,
	CONSTRAINT "clip_range_clip_id_start_end_pk" PRIMARY KEY("clip_id","start","end")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clip_section" (
	"number" numeric PRIMARY KEY NOT NULL,
	"clip_id" uuid,
	"start" numeric NOT NULL,
	"end" numeric NOT NULL,
	"display" varchar(256)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "section_fragment" (
	"section_id" numeric,
	"x" numeric NOT NULL,
	"y" numeric NOT NULL,
	"width" numeric NOT NULL,
	"height" numeric NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "processing" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "updatedAt" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" DROP COLUMN IF EXISTS "title";--> statement-breakpoint
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
 ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_section_id_clip_section_number_fk" FOREIGN KEY ("section_id") REFERENCES "clip_section"("number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
