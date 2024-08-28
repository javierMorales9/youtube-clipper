ALTER TABLE "clip" DROP CONSTRAINT "clip_source_id_source_id_fk";
--> statement-breakpoint
ALTER TABLE "clip_range" DROP CONSTRAINT "clip_range_clip_id_clip_id_fk";
--> statement-breakpoint
ALTER TABLE "clip_section" DROP CONSTRAINT "clip_section_clip_id_clip_id_fk";
--> statement-breakpoint
ALTER TABLE "section_fragment" DROP CONSTRAINT "section_fragment_clip_id_clip_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip" ADD CONSTRAINT "clip_source_id_source_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip_range" ADD CONSTRAINT "clip_range_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clip"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clip_section" ADD CONSTRAINT "clip_section_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clip"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "public"."clip"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
