/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'clip_section'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "clip_section" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "clip_section" ALTER COLUMN "number" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "clip_section" ALTER COLUMN "number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "section_fragment" ALTER COLUMN "section_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "clip_section" ADD CONSTRAINT "clip_section_number_clip_id_pk" PRIMARY KEY("number","clip_id");--> statement-breakpoint
ALTER TABLE "section_fragment" ADD CONSTRAINT "section_fragment_section_id_x_y_pk" PRIMARY KEY("section_id","x","y");