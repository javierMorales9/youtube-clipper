import { Db } from "@/server/db";
import {
  SourceModel,
  source,
  sourceTag,
  sourceTranscription,
} from "@/server/db/schema";
import { Source, Word } from "../domain/Source";
import { eq, sql } from "drizzle-orm";
import { SourceRepository } from "../domain/SourceRepository";

export class PgSourceRepository implements SourceRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async getSources(companyId: string): Promise<Source[]> {
    const sources = await this.db.query.source.findMany({
      where: eq(source.companyId, companyId),
    });

    return parseSources(sources);
  }

  async getSource(id: string): Promise<Source | null> {
    const theSource = await this.db.query.source.findFirst({
      where: eq(source.id, id),
    });

    if (!theSource) {
      return null;
    }

    return parseSource(theSource);
  }

  async saveSource(theSource: Source): Promise<void> {
    const { tags, ...data } = theSource.toPrimitives();

    await this.db.transaction(async (t) => {
      await t
        .insert(source)
        .values({
          id: data.id,
          companyId: data.companyId,
          externalId: data.externalId,
          name: data.name,
          processing: data.processing,
          url: data.url,
          width: data.width,
          height: data.height,
          duration: data.duration,
          genre: data.genre,
          clipLength: data.clipLength,
          processingRangeStart: data.processingRangeStart,
          processingRangeEnd: data.processingRangeEnd,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        })
        .onConflictDoUpdate({
          target: [source.id],
          set: {
            name: data.name,
            processing: data.processing,
            url: data.url,
            width: data.width,
            height: data.height,
            duration: data.duration,
            genre: data.genre,
            clipLength: data.clipLength,
            processingRangeStart: data.processingRangeStart,
            processingRangeEnd: data.processingRangeEnd,
            updatedAt: data.updatedAt,
          },
        });

      if (tags.length > 0) {
        await t
          .insert(sourceTag)
          .values(tags.map((tag) => ({ sourceId: data.id, tag })));
      }
    });
  }

  async getClipWords(
    sourceId: string,
    range: { start: number; end: number },
  ): Promise<Word[]> {
    // The words are in the SourceTranscription table. In a jsonb field called transcription
    // The jsonb field has the following structure:
    // [
    //     { "word": "This", "start": 0, "end": 100 },
    //     { "word": "is", "start": 100, "end": 200 },
    //     ...
    // ]
    // Apply a query similar to this one
    //
    // SELECT word -> 'word', word -> 'start', word -> 'end'
    // FROM source_transcription, jsonb_array_elements(source_transcription.transcription) AS word
    // WHERE
    //   source_transcription.source_id = sourceId
    //   AND CAST((word -> 'start') AS INTEGER) > range.start
    //   AND CAST((word -> 'end') AS INTEGER) < range.end
    //;
    //
    // See the following link for more info about jsonb arrays and how to query them
    // https://hevodata.com/learn/query-jsonb-array-of-objects/
    return (await this.db.execute(sql`
        SELECT word -> 'word' as word, word -> 'start' as start, word -> 'end' as end
        FROM ${sourceTranscription}, jsonb_array_elements(${sourceTranscription.transcription}) AS word
        WHERE
          ${sourceTranscription.sourceId} = ${sourceId}
          AND CAST((word -> 'start') AS INTEGER) > ${range.start * 1000}
          AND CAST((word -> 'end') AS INTEGER) < ${range.end * 1000}
        ;
      `)) as Word[];
  }
}

function parseSource(source: SourceModel, tags?: string[]): Source {
  return new Source({
    id: source.id,
    companyId: source.companyId,
    externalId: source.externalId,
    name: source.name,
    processing: source.processing,
    url: source.url,
    width: source.width,
    height: source.height,
    duration: source.duration,
    genre: source.genre,
    clipLength: source.clipLength,
    processingRangeStart: source.processingRangeStart,
    processingRangeEnd: source.processingRangeEnd,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
    tags: tags,
  });
}

function parseSources(sources: SourceModel[]): Source[] {
  return sources.map((source) => parseSource(source));
}
