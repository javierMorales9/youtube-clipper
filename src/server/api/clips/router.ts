import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  clip,
  clipRange,
  clipSection,
  sectionFragment,
} from "@/server/db/schema";
import { asc, eq } from "drizzle-orm";

export const clipRouter = createTRPCRouter({
  find: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const theClip = await ctx.db.query.clip.findFirst({
        where: eq(clip.id, input.id),
      });

      if (!theClip) return null;

      const range = await ctx.db.query.clipRange.findFirst({
        where: eq(clipRange.clipId, theClip.id),
      });

      if (!range) return null;

      const sections = await ctx.db.query.clipSection.findMany({
        where: eq(clipSection.clipId, theClip.id),
        orderBy: [asc(clipSection.order)],
      }) as any[];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (!section) continue;

        const fragments = await ctx.db.query.sectionFragment.findMany({
          where: eq(sectionFragment.sectionId, section.order),
        });

        sections[i] = {
          ...section,
          fragments,
        };
      }

      return {
        ...theClip,
        range: {
          start: parseFloat(range.start),
          end: parseFloat(range.end),
        },
        sections,
      };
    }),
  create: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        range: z.object({
          start: z.number(),
          end: z.number(),
        }),
        sections: z.array(
          z.object({
            start: z.number(),
            end: z.number(),
            display: z.string(),
            fragments: z.array(
              z.object({
                x: z.number(),
                y: z.number(),
                width: z.number(),
                height: z.number(),
              }),
            ),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { range, sourceId, sections } = input;

      const id = uuidv4();
      await ctx.db.insert(clip).values({
        id,
        sourceId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await ctx.db.insert(clipRange).values({
        clipId: id,
        start: range.start.toString(),
        end: range.end.toString(),
      });

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (!section) continue;

        await ctx.db.insert(clipSection).values({
          order: i,
          clipId: id,
          start: section.start.toString(),
          end: section.end.toString(),
          display: section.display,
        });

        for (const fragment of section.fragments) {
          await ctx.db.insert(sectionFragment).values({
            sectionId: i,
            x: fragment.x.toString(),
            y: fragment.y.toString(),
            width: fragment.width.toString(),
            height: fragment.height.toString(),
          });
        }
      }
    }),
});
