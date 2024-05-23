import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { source } from "@/server/db/schema";
import { Store } from "./Store";
import { eq } from "drizzle-orm";

export const sourceRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({})).query(async ({ ctx }) => {
    return ctx.db.query.source.findMany();
  }),
  find: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const url = await Store().getSignedUrl(input.id);

      const theSource = await ctx.db.query.source.findFirst({
        where: eq(source.id, input.id),
      });

      if (!theSource) return null;

      theSource.url = url;
      return theSource;
    }),
  finishProcessing: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      await ctx.db
        .update(source)
        .set({
          processing: false,
          updatedAt: new Date(),
        })
        .where(eq(source.id, id));
    }),
  initiateUpload: publicProcedure
    .input(z.object({ name: z.string().min(1), parts: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { name } = input;

      const id = uuidv4();

      const { fileId, parts } = await Store().initiateUpload(id, input.parts);

      if (!fileId) {
        throw new Error("Failed to initiate upload");
      }

      await ctx.db.insert(source).values({
        id,
        name,
        processing: true,
        externalId: fileId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return { parts, id };
    }),
  completeUpload: publicProcedure
    .input(
      z.object({
        id: z.string(),
        parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, parts } = input;
      const video = await ctx.db.query.source.findFirst({
        where: eq(source.id, id),
      });
      if (!video || !video.externalId) {
        throw new Error("Video not found");
      }

      const location = await Store().completeUpload(
        video.externalId,
        video.id,
        parts,
      );

      await ctx.db
        .update(source)
        .set({
          url: location,
          updatedAt: new Date(),
          processing: false,
        })
        .where(eq(source.id, id));
    }),
});
