import { z } from "zod";
import { Source, SourceOrigin } from "@/server/entities/source/domain/Source";
import { SourceRepository } from "@/server/entities/source/domain/SourceRepository";
import { Store } from "@/server/entities/source/domain/Store";
import { EventRepository } from "@/server/entities/event/domain/EventRepository";
import { Event } from "@/server/entities/event/domain/Event";
import { VideoRepository } from "../domain/VideoDownloader";

export const SourceDataSchema = z.object({
  name: z.string().min(1),
  genre: z.string(),
  tags: z.array(z.string()),
  clipLength: z.string(),
  range: z.array(z.number()),
});

export const UplaodInputSchema = SourceDataSchema.extend({
  parts: z.number(),
});
type UploadInput = z.infer<typeof UplaodInputSchema>;

export async function initiateUpload(
  repo: SourceRepository,
  store: Store,
  input: UploadInput,
  companyId: string,
) {
  const theSource = Source.newSource({
    companyId: companyId,
    origin: SourceOrigin.Upload,
    name: input.name,
    genre: input.genre,
    clipLength: input.clipLength,
    processingRange: input.range as [number, number],
    tags: input.tags,
  });

  const { fileId, parts } = await store.initiateUpload(
    theSource.id,
    input.parts,
  );

  if (!fileId) {
    throw new Error("Failed to initiate upload");
  }

  theSource.setExternalId(fileId);

  await repo.saveSource(theSource);

  return { parts, id: theSource.id };
}

export const CompleteUploadInputSchema = z.object({
  id: z.string(),
  parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
});
type CompleteUploadInput = z.infer<typeof CompleteUploadInputSchema>;

export async function completeUpload(
  repo: SourceRepository,
  eventRepo: EventRepository,
  store: Store,
  companyId: string,
  input: CompleteUploadInput,
) {
  const { id, parts } = input;

  const theSource = await repo.getSource(id);

  if (!theSource || !theSource.externalId) {
    throw new Error("Video not found");
  }

  await store.completeUpload(theSource.externalId, theSource.id, parts);

  const event = Event.createSourceUploadedEvent(id, companyId);
  await eventRepo.saveEvent(event);
}

export const GetVideoDurationInputSchema = z.object({
  url: z.string(),
});
type GetVideoDurationInput = z.infer<typeof GetVideoDurationInputSchema>;
export async function getUrlVideoDuration(
  videoDownloader: VideoRepository,
  input: GetVideoDurationInput,
) {
  return await videoDownloader.getVideoDuration(input.url);
}

export const NewUrlSourceInputSchema = SourceDataSchema.extend({
  url: z.string(),
});
type NewUrlSourceInput = z.infer<typeof NewUrlSourceInputSchema>;
export async function newUrlSource(
  repo: SourceRepository,
  eventRepo: EventRepository,
  companyId: string,
  input: NewUrlSourceInput,
) {
  const theSource = Source.newSource({
    companyId: companyId,
    origin: SourceOrigin.URL,
    url: input.url,
    name: input.name,
    genre: input.genre,
    clipLength: input.clipLength,
    processingRange: input.range as [number, number],
    tags: input.tags,
  });

  await repo.saveSource(theSource);

  const event = Event.createSourceUploadedEvent(theSource.id, companyId);
  await eventRepo.saveEvent(event);
}
