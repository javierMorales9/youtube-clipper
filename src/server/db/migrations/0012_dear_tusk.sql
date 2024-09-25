DO $$ BEGIN
 ALTER TABLE "processing_event" ADD CONSTRAINT "processing_event_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_event" ADD CONSTRAINT "processing_event_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clip"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
