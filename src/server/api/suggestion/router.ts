import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { PgSuggestionRepository } from "@/server/entities/suggestion/infrastructure/PgSuggestionRepository";

export const suggestionRouter = createTRPCRouter({
  fromSource: protectedProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PgSuggestionRepository(ctx.db);

      const sourceId = input.sourceId;

      const result = await repo.getSourceSuggestions(sourceId);

      return result.map(r => r.toPrimitives());
    }),
});
