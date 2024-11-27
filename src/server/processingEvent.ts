import { newDate } from "@/utils/newDate";
import { randomUUID } from "crypto";

export const ProcessingEvent = {
  SOURCE_UPLOADED: "source_uploaded",
  TRANSCRIPTION_FINISHED: "transcription_finished",
  CLIP_UPDATED: "clip_updated",
};

export function createTranscriptionFinishedEvent(sourceId: string) {
  return {
    id: randomUUID(),
    sourceId,
    type: ProcessingEvent.TRANSCRIPTION_FINISHED,
    startProcessingAt: new Date(newDate().getTime() + 10*60000), //We add 10 minutes to the current time
    createdAt: newDate(),
  };
}

export function createSourceUploadedEvent(sourceId: string) {
  return {
    id: randomUUID(),
    sourceId,
    type: ProcessingEvent.SOURCE_UPLOADED,
    createdAt: newDate(),
  };
}

export function createClipUpdatedEvent(clipId: string, sourceId: string) {
  return {
    id: randomUUID(),
    sourceId,
    clipId,
    type: ProcessingEvent.CLIP_UPDATED,
    createdAt: newDate(),
  };
}
