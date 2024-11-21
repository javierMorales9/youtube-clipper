ALTER TABLE "clip" ADD COLUMN "theme_font" varchar(25) DEFAULT 'Arial' NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_size" integer DEFAULT 12 NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_position" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_main_color" varchar(25) DEFAULT '#000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_secondary_color" varchar(25) DEFAULT '#000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_third_color" varchar(25) DEFAULT '#000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_stroke" varchar(5) DEFAULT 'Small' NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_stroke_color" varchar(25) DEFAULT '#000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_shadow" varchar(5) DEFAULT 'Small' NOT NULL;
ALTER TABLE "clip" ADD COLUMN "theme_upper_text" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clip" ADD COLUMN "theme_emoji" boolean DEFAULT false NOT NULL;
