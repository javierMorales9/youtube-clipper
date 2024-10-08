import { randomUUID } from "crypto";

export const ProcessingEvent = {
  SOURCE_UPLOADED: "source_uploaded",
  CLIP_UPDATED: "clip_updated",
};

export function createSourceUploadedEvent(sourceId: string) {
  return {
    id: randomUUID(),
    sourceId,
    type: ProcessingEvent.SOURCE_UPLOADED,
    createdAt: new Date(),
  };
}

export function createClipUpdatedEvent(clipId: string, sourceId: string) {
  return {
    id: randomUUID(),
    sourceId,
    clipId,
    type: ProcessingEvent.CLIP_UPDATED,
    createdAt: new Date(),
  };
}
