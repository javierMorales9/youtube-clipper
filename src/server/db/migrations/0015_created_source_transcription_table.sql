CREATE TABLE IF NOT EXISTS "source_transcription" (
	"source_id" uuid PRIMARY KEY NOT NULL,
	"transcription" jsonb NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "source_transcription" ADD CONSTRAINT "source_transcription_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
