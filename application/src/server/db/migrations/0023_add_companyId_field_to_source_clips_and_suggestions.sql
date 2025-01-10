ALTER TABLE "clip" ADD COLUMN "company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "processing_event" ADD COLUMN "company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "source" ADD COLUMN "company_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "suggestion" ADD COLUMN "company_id" uuid NOT NULL;