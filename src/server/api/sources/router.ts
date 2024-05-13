import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { source } from "@/server/db/schema";
import { S3Uploader } from "./S3Upload";

export const sourceRouter = createTRPCRouter({
  initiateUpload: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { name } = input;
      return await S3Uploader.initiateUpload(name);
    }),
  getSignedUrls: publicProcedure
    .input(
      z.object({ fileId: z.string(), fileKey: z.string(), parts: z.number() }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fileId, fileKey, parts } = input;
      return await S3Uploader.getSignedUrls(fileId, fileKey, parts);
    }),
  completeUpload: publicProcedure
    .input(
      z.object({
        fileId: z.string(),
        fileKey: z.string(),
        parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { fileId, fileKey, parts } = input;
      await S3Uploader.completeUpload(fileId, fileKey, parts);
    }),
  create: publicProcedure
    .input(z.object({ name: z.string().min(1), url: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(source).values({
        id: uuidv4(),
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
  all: publicProcedure.input(z.object({})).query(async ({ ctx }) => {
    return ctx.db.query.source.findMany();
  }),
});

