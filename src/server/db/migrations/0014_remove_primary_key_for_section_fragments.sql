ALTER TABLE "section_fragment" DROP CONSTRAINT "section_fragment_section_order_clip_id_pk";--> statement-breakpoint
ALTER TABLE "section_fragment" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_section_order_clip_id_order_pk" PRIMARY KEY("section_order","clip_id","order");
