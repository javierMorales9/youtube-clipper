ALTER TABLE "clip" ALTER COLUMN "theme_main_color" SET DEFAULT '#d4c591';--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_secondary_color" SET DEFAULT '#63edc3';--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_third_color" SET DEFAULT '#9560c6';--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_stroke" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_shadow" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "clip" ALTER COLUMN "theme_shadow" SET DEFAULT 'Medium';--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_emoji_position" varchar(20) DEFAULT 'Top' NOT NULL;
