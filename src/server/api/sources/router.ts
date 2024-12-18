import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { storeFactory } from "@/server/entities/source/infrastructure/storeFactory";
import { Source } from "@/server/entities/source/domain/Source";
import { PgSourceRepository } from "@/server/entities/source/infrastructure/PgSourceRepository";
import { Event } from "@/server/entities/event/domain/Event";
import { PgEventRepository } from "@/server/entities/event/infrastructure/PgEventRepository";

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
      return {
        ...theSource.toPrimitives(),
        url: manifest,
        timelineUrl: timeline,
      };
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
      const { fileId, parts } = await store.initiateUpload(
        theSource.id,
        input.parts,
      );

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
      const eventRepo = new PgEventRepository(ctx.db);

      const store = storeFactory();

      const { id, parts } = input;

      const theSource = await repo.getSource(id);

      if (!theSource || !theSource.externalId) {
        throw new Error("Video not found");
      }

      await store.completeUpload(theSource.externalId, theSource.id, parts);

      const event = Event.createSourceUploadedEvent(id, ctx.company.id);
      await eventRepo.saveEvent(event);
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
