import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  clip,
  clipRange,
  clipSection,
  sectionFragment,
} from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";

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

      const sections = (await ctx.db.query.clipSection.findMany({
        where: eq(clipSection.clipId, theClip.id),
        orderBy: [asc(clipSection.order)],
      })) as any[];

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        if (!section) continue;

        const fragments = await ctx.db.query.sectionFragment.findMany({
          where: and(
            eq(sectionFragment.sectionOrder, section.order),
            eq(sectionFragment.clipId, theClip.id),
          ),
        });

        sections[i] = {
          ...section,
          fragments,
        };
      }

      return {
        ...theClip,
        range: {
          start: range.start,
          end: range.end,
        },
        sections,
      };
    }),
  create: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        clipId: z.string().optional(),
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
      console.log("input", input);
      ctx.db.transaction(async (trans) => {
        const { clipId, range, sourceId, sections } = input;

        const id = clipId || uuidv4();
        await trans
          .insert(clip)
          .values({
            id,
            sourceId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [clip.id],
            set: {
              updatedAt: new Date(),
            },
          });

        await trans
          .insert(clipRange)
          .values({
            clipId: id,
            start: Math.floor(range.start),
            end: Math.floor(range.end),
          })
          .onConflictDoUpdate({
            target: [clipRange.clipId, clipRange.start, clipRange.end],
            set: {
              start: Math.floor(range.start),
              end: Math.floor(range.end),
            },
          });

        await trans
          .delete(sectionFragment)
          .where(eq(sectionFragment.clipId, id));
        await trans.delete(clipSection).where(eq(clipSection.clipId, id));

        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          if (!section) continue;

          await trans.insert(clipSection).values({
            order: i,
            clipId: id,
            start: Math.floor(section.start),
            end: Math.floor(section.end),
            display: section.display,
          });
          for (const fragment of section.fragments) {
            await trans.insert(sectionFragment).values({
              sectionOrder: i,
              clipId: id,
              x: Math.floor(fragment.x),
              y: Math.floor(fragment.y),
              width: Math.floor(fragment.width),
              height: Math.floor(fragment.height),
            });
          }
        }
      });
    }),
});
