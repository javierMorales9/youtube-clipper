import { Db } from "@/server/db";
import { ClipRepository } from "../domain/ClipRepository";
import { Clip, SectionSchema, ThemeSchema } from "../domain/Clip";
import {
  ClipTable as ClipModel,
  clip,
  clipRange,
  clipSection,
  sectionFragment,
} from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";

export class PgClipRepository implements ClipRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async find(id: string): Promise<Clip | null> {
    const theClip = await this.db.query.clip.findFirst({
      where: eq(clip.id, id),
    });

    if (!theClip) return null;

    return await this.completeClip(theClip);
  }

  async fromSource(sourceId: string): Promise<Clip[]> {
    const clips = await this.db.query.clip.findMany({
      where: eq(clip.sourceId, sourceId),
    });

    return await this.completeClips(clips);
  }

  async save(data: Clip) {
    const {
      id,
      companyId,
      name,
      range,
      width,
      height,
      sourceId,
      sections,
      createdAt,
      updatedAt,
    } = data.toPrimitives();

    if (!id) throw new Error("No id provided");

    await this.db.transaction(async (trans) => {
      await trans
        .insert(clip)
        .values({
          id,
          name,
          sourceId,
          companyId,
          width: width.toString(),
          height: height.toString(),
          ...data.theme,
          processing: data.processing ?? true,
          createdAt,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: [clip.id],
          set: {
            name,
            width: width.toString(),
            height: height.toString(),
            ...data.theme,
            processing: data.processing ?? true,
            updatedAt,
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

  private async completeClips(clips: ClipModel[]): Promise<Clip[]> {
    const result: Clip[] = [];
    for(const clip of clips) {
      result.push(await this.completeClip(clip));
    }
    return result;
  }

  private async completeClip(theClip: ClipModel): Promise<Clip> {
    const range = await this.db.query.clipRange.findFirst({
      where: eq(clipRange.clipId, theClip.id),
    });

    if (!range) throw new Error("No range found");

    const sections = await Promise.all(
      (
        await this.db.query.clipSection.findMany({
          where: eq(clipSection.clipId, theClip.id),
          orderBy: [asc(clipSection.order)],
        })
      ).map(async (section, i) => {
        const fragments = await this.db.query.sectionFragment.findMany({
          where: and(
            eq(sectionFragment.sectionOrder, section.order),
            eq(sectionFragment.clipId, theClip.id),
          ),
        });

        return SectionSchema.parse({
          ...section,
          fragments,
        });
      }),
    );

    return new Clip({
      ...theClip,
      width: parseInt(theClip.width),
      height: parseInt(theClip.height),
      range: {
        start: range.start,
        end: range.end,
      },
      theme: ThemeSchema.parse({
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
      }),
      sections,
      createdAt: theClip.createdAt,
      updatedAt: theClip.updatedAt,
    });
  }
}
