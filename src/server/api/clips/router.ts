import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  clip,
  clipRange,
  clipSection,
  sectionFragment,
  source,
} from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { ClipProcessor } from "./ClipProcessor";
import { Clip, ClipSchema } from "./ClipSchema";

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

      const sections = await Promise.all(
        (
          await ctx.db.query.clipSection.findMany({
            where: eq(clipSection.clipId, theClip.id),
            orderBy: [asc(clipSection.order)],
          })
        ).map(async (section, i) => {
          if (!section) return null;

          const fragments = await ctx.db.query.sectionFragment.findMany({
            where: and(
              eq(sectionFragment.sectionOrder, section.order),
              eq(sectionFragment.clipId, theClip.id),
            ),
          });

          return {
            ...section,
            fragments,
          };
        }),
      );

      return {
        ...theClip,
        range: {
          start: range.start,
          end: range.end,
        },
        sections,
      };
    }),
  fromSource: publicProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const clips = await ctx.db.query.clip.findMany({
        where: eq(clip.sourceId, input.sourceId),
      });

      const realClips: Clip[] = [];

      for (const theClip of clips) {
        const range = await ctx.db.query.clipRange.findFirst({
          where: eq(clipRange.clipId, theClip.id),
        });

        if (!range) continue;

        const sections = await Promise.all(
          (
            await ctx.db.query.clipSection.findMany({
              where: eq(clipSection.clipId, theClip.id),
              orderBy: [asc(clipSection.order)],
            })
          ).map(async (section, i) => {
            const fragments = await ctx.db.query.sectionFragment.findMany({
              where: and(
                eq(sectionFragment.sectionOrder, section.order),
                eq(sectionFragment.clipId, theClip.id),
              ),
            });

            return {
              ...section,
              fragments,
            };
          }),
        );

        realClips.push({
          ...theClip,
          range: {
            start: range.start,
            end: range.end,
          },
          sections,
        });
      }

      return realClips;
    }),
  create: publicProcedure.input(ClipSchema).mutation(async ({ ctx, input }) => {
    const { name, clipId, range, width, height, sourceId, sections } = input;
    console.log("Creating the thing", JSON.stringify(input, null, 2));
    const id = clipId || uuidv4();

    await ctx.db.transaction(async (trans) => {
      await trans
        .insert(clip)
        .values({
          id,
          name,
          sourceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          width: width.toString(),
          height: height.toString(),
          processing: true,
        })
        .onConflictDoUpdate({
          target: [clip.id],
          set: {
            name,
            updatedAt: new Date(),
            width: width.toString(),
            height: height.toString(),
            processing: true,
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

      await trans.delete(sectionFragment).where(eq(sectionFragment.clipId, id));

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

    const theSource = await ctx.db.query.source.findFirst({
      where: eq(source.id, sourceId),
    });

    if (!theSource) throw new Error("Source not found");

    await ClipProcessor().processClip(
      id,
      input,
      theSource.width!,
      theSource.height!,
    );
  }),
  finishProcessing: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      await ctx.db
        .update(clip)
        .set({
          processing: false,
          updatedAt: new Date(),
        })
        .where(eq(clip.id, id));
    }),
});
