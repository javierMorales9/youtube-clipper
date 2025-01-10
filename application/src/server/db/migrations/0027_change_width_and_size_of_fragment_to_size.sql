ALTER TABLE "clip" ALTER COLUMN "theme_font" SET DEFAULT 'Komika';--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_font_color" SET DEFAULT '#FFFFFF';--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_shadow" SET DEFAULT 'None';--> statement-breakpoint
ALTER TABLE "section_fragment" ADD COLUMN "size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "section_fragment" DROP COLUMN IF EXISTS "width";--> statement-breakpoint
ALTER TABLE "section_fragment" DROP COLUMN IF EXISTS "height";