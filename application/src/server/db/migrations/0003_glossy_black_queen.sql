ALTER TABLE "clip" ALTER COLUMN "source_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clip_range" ALTER COLUMN "clip_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clip_section" ALTER COLUMN "number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clip_section" ALTER COLUMN "clip_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "clip_section" ALTER COLUMN "display" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "section_fragment" ALTER COLUMN "section_order" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "section_fragment" ALTER COLUMN "clip_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "external_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "width" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ALTER COLUMN "height" DROP NOT NULL;