import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ClipSchema, Clip } from "@/server/entities/clip/domain/Clip";
import { Event } from "@/server/entities/event/domain/Event";
import { PgEventRepository } from "@/server/entities/event/infrastructure/PgEventRepository";
import { PgClipRepository } from "@/server/entities/clip/infrastructure/PgClipRepository";

export const clipRouter = createTRPCRouter({
  find: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      const theClip = await repo.find(input.id);

      if (!theClip) return null;

      return theClip.toPrimitives();
    }),
  fromSource: protectedProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      const clips = await repo.fromSource(input.sourceId);
      return clips.map((clip) => clip.toPrimitives());
    }),
  createNew: protectedProcedure
    .input(
      z.object({
        sourceId: z.string(),
        start: z.number(),
        end: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      const clip = Clip.new({ ...input, companyId: ctx.company.id });

      repo.save(clip);

      return clip.toPrimitives();
    }),
  save: protectedProcedure
    .input(ClipSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);
      const eventRepo = new PgEventRepository(ctx.db);

      console.log("Saving clip", JSON.stringify(input, null, 2));

      const clip = await repo.find(input.id);

      if (!clip) {
        throw new Error("Clip not found");
      }

      clip.update(input);
      await repo.save(clip);

      const event = Event.createClipUpdatedEvent(
        input.id,
        input.sourceId,
        ctx.company.id,
      );
      await eventRepo.saveEvent(event);
    }),
  finishProcessing: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      const theC = await repo.find(input.id);
      if (!theC) throw new Error("Clip not found");

      theC.finishProcessing();

      await repo.save(theC);
    }),
});
