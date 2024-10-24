CREATE TABLE IF NOT EXISTS "source_tag" (
	"source_id" uuid NOT NULL,
	"tag" varchar(256) NOT NULL,
	CONSTRAINT "source_tag_source_id_tag_pk" PRIMARY KEY("source_id","tag")
);
--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "genre" varchar(256);--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "clip_length" varchar(256);--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "processing_range_start" integer;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "processing_range_end" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "source_tag" ADD CONSTRAINT "source_tag_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
