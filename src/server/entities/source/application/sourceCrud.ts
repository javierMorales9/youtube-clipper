import { z } from "zod";
import { SourceRepository } from "@/server/entities/source/domain/SourceRepository";
import { Store } from "@/server/entities/source/domain/Store";

export async function all(
  repo: SourceRepository,
  store: Store,
  companyId: string,
) {
  const sources = await repo.getSources(companyId);
  return Promise.all(
    sources.map(async (source) => {
      const { manifest, timeline, snapshot } = await store.getSignedUrls(
        source.id,
      );
      return {
        ...source.toPrimitives(),
        url: manifest,
        timelineUrl: timeline,
        snapshotUrl: snapshot,
      };
    }),
  );
}

export const FindInputSchema = z.object({ id: z.string() });
type FindInput = z.infer<typeof FindInputSchema>;
export async function find(repo: SourceRepository, store: Store, input: FindInput) {
  const { id } = input;

  const theSource = await repo.getSource(id);
  if (!theSource) return null;

  const { manifest, timeline } = await store.getSignedUrls(id);
  return {
    ...theSource.toPrimitives(),
    url: manifest,
    timelineUrl: timeline,
  };
}

export const GetClipWordsInputSchema = z.object({
  sourceId: z.string(),
  range: z.object({ start: z.number(), end: z.number() }),
});
export type GetClipWordsInput = z.infer<typeof GetClipWordsInputSchema>;

export async function getClipWords(
  repo: SourceRepository,
  input: GetClipWordsInput,
) {
  return await repo.getClipWords(input.sourceId, input.range);
}
