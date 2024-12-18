import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  processingEvent,
  suggestion,
} from "@/server/db/schema";
import { storeFactory } from "@/server/entities/source/infrastructure/storeFactory";
import { createSourceUploadedEvent } from "@/server/processingEvent";
import { Source } from "@/server/entities/source/domain/Source";
import { PgSourceRepository } from "@/server/entities/source/infrastructure/PgSourceRepository";

export const sourceRouter = createTRPCRouter({
  all: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const repo = new PgSourceRepository(ctx.db);
    const store = storeFactory();

    const sources = await repo.getSources(ctx.company.id);
    return Promise.all(
      sources.map(async (source) => {
        const { manifest, timeline, snapshot } = await store.getSignedUrls(
          source.id,
        );
        return {
          ...source.toPrimitives(),
          url: manifest,
          timelineUrl: timeline,
          snapshotUrl: snapshot,
        };
      }),
    );
  }),
  find: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);
      const store = storeFactory();

      const theSource = await repo.getSource(input.id);
      if (!theSource) return null;

      const { manifest, timeline } = await store.getSignedUrls(input.id);
      return { ...theSource.toPrimitives(), url: manifest, timelineUrl: timeline };
    }),
  finishProcessing: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        resolution: z.string(),
        duration: z.number(),
        suggestions: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            start: z.number(),
            end: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);

      const { id, resolution } = input;
      const res = resolution.slice(0, -1).split("x").map(Number);

      const theSource = await repo.getSource(id);

      if (!theSource) {
        throw new Error("Source not found");
      }

      theSource.finishProcessing(res[0]!, res[1]!, input.duration);

      await repo.saveSource(theSource);

      const suggestionObjs = input.suggestions.map((suggestion) => ({
        id: uuidv4(),
        companyId: ctx.company.id,
        ...suggestion,
        sourceId: id,
      }));
      await ctx.db.insert(suggestion).values(suggestionObjs);
    }),
  initiateUpload: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        genre: z.string(),
        tags: z.array(z.string()),
        clipLength: z.string(),
        range: z.array(z.number()),
        parts: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);

      const theSource = Source.newSource({
        companyId: ctx.company.id,
        name: input.name,
        externalId: "",
        genre: input.genre,
        clipLength: input.clipLength,
        processingRange: input.range as [number, number],
        tags: input.tags,
      });

      const store = storeFactory();
      const { fileId, parts } = await store.initiateUpload(theSource.id, input.parts);

      if (!fileId) {
        throw new Error("Failed to initiate upload");
      }

      await repo.saveSource(theSource);

      return { parts, id: theSource.id };
    }),
  completeUpload: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);
      const store = storeFactory();

      const { id, parts } = input;
      
      const theSource = await repo.getSource(id);

      if (!theSource || !theSource.externalId) {
        throw new Error("Video not found");
      }

      await store.completeUpload(
        theSource.externalId,
        theSource.id,
        parts,
      );

      await ctx.db
        .insert(processingEvent)
        .values(createSourceUploadedEvent(id, ctx.company.id));
    }),
  getClipWords: protectedProcedure
    .input(
      z.object({
        sourceId: z.string(),
        range: z.object({ start: z.number(), end: z.number() }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);

      return await repo.getClipWords(input.sourceId, input.range);
    }),
});
