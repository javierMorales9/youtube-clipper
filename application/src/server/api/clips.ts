import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { ClipSchema } from "@/server/entities/clip/domain/Clip";
import { PgEventRepository } from "@/server/entities/event/infrastructure/PgEventRepository";
import { PgClipRepository } from "@/server/entities/clip/infrastructure/PgClipRepository";
import * as clipCrud from "@/server/entities/clip/application/clipCrud";
import * as clipProcessing from "@/server/entities/clip/application/clipProcessing";
import { PgSuggestionRepository } from "../entities/suggestion/infrastructure/PgSuggestionRepository";

export const clipRouter = createTRPCRouter({
  find: protectedProcedure
    .input(clipCrud.FindInputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      return await clipCrud.find(repo, input);
    }),
  fromSource: protectedProcedure
    .input(clipCrud.FromSourceInputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      return await clipCrud.fromSource(repo, input);
    }),
  createNew: protectedProcedure
    .input(clipCrud.CreateNewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      return await clipCrud.createNew(repo, ctx.company.id, input);
    }),
  createFromSuggestion: protectedProcedure
    .input(clipCrud.CreateFromSuggestionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);
      const suggestionRepo = new PgSuggestionRepository(ctx.db);

      return await clipCrud.createFromSuggestion(repo, suggestionRepo, input);
    }),
  save: protectedProcedure
    .input(ClipSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);
      const eventRepo = new PgEventRepository(ctx.db);

      return await clipCrud.save(repo, eventRepo, ctx.company.id, input);
    }),
  finishProcessing: protectedProcedure
    .input(clipProcessing.FinishProcessingInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgClipRepository(ctx.db);

      return await clipProcessing.finishProcessing(repo, input);
    }),
});
