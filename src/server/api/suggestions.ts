import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { PgSuggestionRepository } from "@/server/entities/suggestion/infrastructure/PgSuggestionRepository";
import * as suggestionCrud from "@/server/entities/suggestion/application/suggestionCrud";

export const suggestionRouter = createTRPCRouter({
  fromSource: protectedProcedure
    .input(suggestionCrud.FromSourceInputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new PgSuggestionRepository(ctx.db);

      return await suggestionCrud.fromSource(repo, input);
    }),
});
