import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  processingEvent,
  source,
  sourceTag,
  sourceTranscription,
  suggestion,
} from "@/server/db/schema";
import { Store } from "./Store";
import { eq, sql } from "drizzle-orm";
import { createSourceUploadedEvent } from "@/server/processingEvent";

export const sourceRouter = createTRPCRouter({
  all: publicProcedure.input(z.object({})).query(async ({ ctx }) => {
    const sources = await ctx.db.query.source.findMany();

    return Promise.all(
      sources.map(async (source) => {
        const { manifest, timeline, snapshot } = await Store().getSignedUrls(
          source.id,
        );
        return {
          ...source,
          url: manifest,
          timelineUrl: timeline,
          snapshotUrl: snapshot,
        };
      }),
    );
  }),
  find: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { manifest, timeline } = await Store().getSignedUrls(input.id);

      const theSource = await ctx.db.query.source.findFirst({
        where: eq(source.id, input.id),
      });

      if (!theSource) return null;

      return { ...theSource, url: manifest, timelineUrl: timeline };
    }),
  finishProcessing: publicProcedure
    .input(
      z.object({
        id: z.string(),
        resolution: z.string(),
        duration: z.number(),
        suggestions: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            start: z.number(),
            end: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, resolution } = input;
      const res = resolution.slice(0, -1).split("x").map(Number);

      await ctx.db
        .update(source)
        .set({
          processing: false,
          updatedAt: new Date(),
          width: res[0],
          height: res[1],
          duration: input.duration,
        })
        .where(eq(source.id, id));

      const suggestionObjs = input.suggestions.map((suggestion) => ({
        id: uuidv4(),
        ...suggestion,
        sourceId: id,
      }));
      await ctx.db.insert(suggestion).values(suggestionObjs);
    }),
  initiateUpload: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        genre: z.string(),
        tags: z.array(z.string()),
        clipLength: z.string(),
        range: z.array(z.number()),
        parts: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const id = uuidv4();

      const { fileId, parts } = await Store().initiateUpload(id, input.parts);

      if (!fileId) {
        throw new Error("Failed to initiate upload");
      }

      ctx.db.transaction(async (t) => {
        console.log("input", input);
        await t.insert(source).values({
          id,
          name: input.name,
          processing: true,
          externalId: fileId,
          genre: input.genre,
          clipLength: input.clipLength,
          processingRangeStart: Math.floor(input.range[0]!),
          processingRangeEnd: Math.floor(input.range[1]!),
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (input.tags.length > 0) {
          await t
            .insert(sourceTag)
            .values(input.tags.map((tag) => ({ sourceId: id, tag })));
        }
      });

      return { parts, id };
    }),
  completeUpload: publicProcedure
    .input(
      z.object({
        id: z.string(),
        parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, parts } = input;
      const video = await ctx.db.query.source.findFirst({
        where: eq(source.id, id),
      });
      if (!video || !video.externalId) {
        throw new Error("Video not found");
      }

      const location = await Store().completeUpload(
        video.externalId,
        video.id,
        parts,
      );

      await ctx.db
        .update(source)
        .set({
          url: location,
          updatedAt: new Date(),
        })
        .where(eq(source.id, id));

      await ctx.db
        .insert(processingEvent)
        .values(createSourceUploadedEvent(id));
    }),
  getClipWords: publicProcedure
    .input(
      z.object({
        sourceId: z.string(),
        range: z.object({ start: z.number(), end: z.number() }),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      const query = sql`
        SELECT word -> 'word', word -> 'start', word -> 'end'
        FROM source_transcription, jsonb_array_elements(source_transcription.transcription) AS word
        WHERE
          source_transcription.source_id = ${input.sourceId}
          AND CAST((word -> 'start') AS INTEGER) > ${input.range.start}
          AND CAST((word -> 'end') AS INTEGER) < ${input.range.end}
      `;
      console.log(query)
      return await ctx.db.execute(sql`
        SELECT word -> 'word', word -> 'start', word -> 'end'
        FROM ${sourceTranscription}, jsonb_array_elements(${sourceTranscription.transcription}) AS word
        WHERE
          ${sourceTranscription.sourceId} = ${input.sourceId}
          AND CAST((word -> 'start') AS INTEGER) > ${input.range.start}
          AND CAST((word -> 'end') AS INTEGER) < ${input.range.end}
      `);
    }),
});
