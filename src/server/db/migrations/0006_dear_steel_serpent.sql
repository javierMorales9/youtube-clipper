CREATE TABLE IF NOT EXISTS "suggestion" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"name" varchar(256) DEFAULT '' NOT NULL,
	"description" text,
	"start" integer NOT NULL,
	"end" integer NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "suggestion" ADD CONSTRAINT "suggestion_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
