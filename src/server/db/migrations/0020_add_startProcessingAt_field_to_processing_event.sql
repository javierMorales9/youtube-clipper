ALTER TABLE "processing_event" ADD COLUMN "start_processing_at" timestamp with time zone;

ALTER TABLE "source"
ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING ("created_at"::timestamp with time zone);

ALTER TABLE "source"
ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone USING ("updatedAt"::timestamp with time zone);

ALTER TABLE "clip"
ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING ("created_at"::timestamp with time zone);

ALTER TABLE "clip"
ALTER COLUMN "updatedAt" SET DATA TYPE timestamp with time zone USING ("updatedAt"::timestamp with time zone);

ALTER TABLE "processing_event"
ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING ("created_at"::timestamp with time zone);

ALTER TABLE "processing_event"
ALTER COLUMN "finished_at" SET DATA TYPE timestamp with time zone USING ("finished_at"::timestamp with time zone);
