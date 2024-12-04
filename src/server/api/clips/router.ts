import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  ClipTable,
  clip,
  clipRange,
  clipSection,
  processingEvent,
  sectionFragment,
  source,
} from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";
import {
  Clip,
  ClipSchema,
  defaultDisplay,
  defaultFragments,
  defaultHeight,
  defaultTheme,
  defaultWidth,
} from "./ClipSchema";
import { createClipUpdatedEvent } from "@/server/processingEvent";
import { Db } from "@/server/db";
import { newDate } from "@/utils/newDate";

export const clipRouter = createTRPCRouter({
  find: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const theClip = await ctx.db.query.clip.findFirst({
        where: eq(clip.id, input.id),
      });

      if (!theClip) return null;

      return await completeClip(ctx.db, theClip);
    }),
  fromSource: protectedProcedure
    .input(z.object({ sourceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const clips = await ctx.db.query.clip.findMany({
        where: eq(clip.sourceId, input.sourceId),
      });

      const realClips: Clip[] = [];

      for (const theClip of clips) {
        realClips.push(await completeClip(ctx.db, theClip));
      }

      return realClips;
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
      const clip: Clip = {
        id: uuidv4(),
        name: "",
        sourceId: input.sourceId,
        range: {
          start: input.start,
          end: input.end,
        },
        width: defaultWidth,
        height: defaultHeight,
        sections: [
          {
            start: 0,
            end: input.end - input.start,
            display: defaultDisplay,
            fragments: defaultFragments,
          },
        ],
        theme: defaultTheme,
      };

      await saveClip(ctx.db, clip);

      return clip;
    }),
  create: protectedProcedure.input(ClipSchema).mutation(async ({ ctx, input }) => {
    console.log("Saving clip", JSON.stringify(input, null, 2));
    input.id = input.id || uuidv4();
    await saveClip(ctx.db, input);

    const theSource = await ctx.db.query.source.findFirst({
      where: eq(source.id, input.sourceId),
    });

    if (!theSource) throw new Error("Source not found");

    await ctx.db
      .insert(processingEvent)
      .values(createClipUpdatedEvent(input.id, input.sourceId));
  }),
  finishProcessing: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      await ctx.db
        .update(clip)
        .set({
          processing: false,
          updatedAt: newDate(),
        })
        .where(eq(clip.id, id));
    }),
});

async function completeClip(db: Db, theClip: ClipTable): Promise<Clip> {
  const range = await db.query.clipRange.findFirst({
    where: eq(clipRange.clipId, theClip.id),
  });

  if (!range) throw new Error("No range found");

  const sections = await Promise.all(
    (
      await db.query.clipSection.findMany({
        where: eq(clipSection.clipId, theClip.id),
        orderBy: [asc(clipSection.order)],
      })
    ).map(async (section, i) => {
      const fragments = await db.query.sectionFragment.findMany({
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

  return ClipSchema.parse({
    ...theClip,
    width: parseInt(theClip.width),
    height: parseInt(theClip.height),
    range: {
      start: range.start,
      end: range.end,
    },
    theme: {
      themeFont: theClip.themeFont,
      themeFontColor: theClip.themeFontColor,
      themeSize: theClip.themeSize,
      themeMainColor: theClip.themeMainColor,
      themeSecondaryColor: theClip.themeSecondaryColor,
      themeThirdColor: theClip.themeThirdColor,
      themeShadow: theClip.themeShadow,
      themeStroke: theClip.themeStroke,
      themeStrokeColor: theClip.themeStrokeColor,
      themeUpperText: theClip.themeUpperText,
      themePosition: theClip.themePosition,
      themeEmoji: theClip.themeEmoji,
      themeEmojiPosition: theClip.themeEmojiPosition,
    },
    sections,
  });
}

async function saveClip(db: Db, data: Clip) {
  const { id, name, range, width, height, sourceId, sections } = data;

  if (!id) throw new Error("No id provided");

  await db.transaction(async (trans) => {
    await trans
      .insert(clip)
      .values({
        id,
        name,
        sourceId,
        width: width.toString(),
        height: height.toString(),
        ...data.theme,
        processing: data.processing ?? true,
        createdAt: newDate(),
        updatedAt: newDate(),
      })
      .onConflictDoUpdate({
        target: [clip.id],
        set: {
          name,
          width: width.toString(),
          height: height.toString(),
          ...data.theme,
          processing: data.processing ?? true,
          updatedAt: newDate(),
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
      for (let j = 0; j < section.fragments.length; j++) {
        const fragment = section.fragments[j]!;
        await trans.insert(sectionFragment).values({
          order: j,
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
}
