import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { suggestion } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const suggestionRouter = createTRPCRouter({
  fromSource: publicProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const sourceId = input.sourceId;

      const result = await ctx.db
        .select()
        .from(suggestion)
        .where(eq(suggestion.sourceId, sourceId));

      return result.map(el => ({
        id: el.id,
        sourceid: el.sourceId,
        name: el.name,
        description: el.description,
        range: {
          start: el.start,
          end: el.end,
        },
      }));
    }),
});
