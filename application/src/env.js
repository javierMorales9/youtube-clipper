import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    SECRET: z.string(),
    AWS_REGION: z.string().default('eu-west-1'),
    SOURCE_BUCKET: z.string().optional(),
    AWS_ACCESS_KEY_ID: z.string().optional(),
    AWS_SECRET_ACCESS_KEY: z.string().optional(),
    AFTER_UPLOAD_URL: z.string().optional(),
    AFTER_CLIP_URL: z.string().optional(),
    JOB_QUEUE: z.string().optional(),
    AFTER_CLIP_JOB_DEFINITION: z.string().optional(),
    HLS: z.boolean({coerce: true}).optional().default(false),
    CLOUDFRONT_URL: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    SECRET: process.env.SECRET,
    AWS_REGION: process.env.AWS_REGION,
    SOURCE_BUCKET: process.env.SOURCE_BUCKET,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AFTER_UPLOAD_URL: process.env.AFTER_UPLOAD_URL,
    AFTER_CLIP_URL: process.env.AFTER_CLIP_URL,
    JOB_QUEUE: process.env.JOB_QUEUE,
    AFTER_CLIP_JOB_DEFINITION: process.env.AFTER_CLIP_JOB_DEFINITION,
    HLS: process.env.HLS,
    CLOUDFRONT_URL: process.env.CLOUDFRONT_URL,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
