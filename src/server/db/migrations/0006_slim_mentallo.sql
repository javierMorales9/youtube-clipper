ALTER TABLE "section_fragment" RENAME COLUMN "section_id" TO "section_order";--> statement-breakpoint
ALTER TABLE "section_fragment" DROP CONSTRAINT "section_fragment_section_id_clip_section_number_fk";
--> statement-breakpoint
ALTER TABLE "section_fragment" DROP CONSTRAINT "section_fragment_section_id_x_y_pk";--> statement-breakpoint
ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_section_order_clip_id_pk" PRIMARY KEY("section_order","clip_id");--> statement-breakpoint
ALTER TABLE "section_fragment" ADD COLUMN "clip_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_section_order_clip_section_number_fk" FOREIGN KEY ("section_order") REFERENCES "clip_section"("number") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_clip_id_clip_id_fk" FOREIGN KEY ("clip_id") REFERENCES "clip"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
