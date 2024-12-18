import { newDate } from "@/utils/newDate";
import { randomUUID } from "crypto";
import { z } from "zod";

export const EventSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  companyId: z.string(),
  clipId: z.string().nullable().optional(),
  type: z.string(),
  createdAt: z.date(),
  finishedAt: z.date().nullable().optional(),
  startProcessingAt: z.date().nullable().optional(),
  error: z.string().nullable().optional(),
});

export const ProcessingEvent = {
  SOURCE_UPLOADED: "source_uploaded",
  TRANSCRIPTION_FINISHED: "transcription_finished",
  CLIP_UPDATED: "clip_updated",
};

export class Event {
  readonly id: string;
  private sourceId: string;
  private companyId: string;
  private clipId?: string;
  private type: string;
  private createdAt: Date;
  private finishedAt?: Date;
  private startProcessingAt?: Date;
  private error?: string;

  constructor({
    id,
    sourceId,
    companyId,
    clipId,
    type,
    createdAt,
    finishedAt,
    startProcessingAt,
    error,
  }: {
    id: string;
    sourceId: string;
    companyId: string;
    clipId?: string;
    type: string;
    createdAt: Date;
    finishedAt?: Date;
    startProcessingAt?: Date;
    error?: string;
  }) {
    this.id = id;
    this.sourceId = sourceId;
    this.companyId = companyId;
    this.clipId = clipId;
    this.type = type;
    this.createdAt = createdAt;
    this.finishedAt = finishedAt;
    this.startProcessingAt = startProcessingAt;
    this.error = error;
  }

  toPrimitives() {
    return {
      id: this.id,
      sourceId: this.sourceId,
      companyId: this.companyId,
      clipId: this.clipId,
      type: this.type,
      createdAt: this.createdAt,
      finishedAt: this.finishedAt,
      startProcessingAt: this.startProcessingAt,
      error: this.error,
    };
  }

  static createTranscriptionFinishedEvent(sourceId: string, companyId: string) {
    return new Event({
      id: randomUUID(),
      companyId,
      sourceId,
      type: ProcessingEvent.TRANSCRIPTION_FINISHED,
      startProcessingAt: new Date(newDate().getTime() + 10 * 60000), //We add 10 minutes to the current time
      createdAt: newDate(),
    });
  }

  static createSourceUploadedEvent(sourceId: string, companyId: string) {
    return new Event({
      id: randomUUID().toString(),
      companyId: companyId,
      sourceId: sourceId,
      type: ProcessingEvent.SOURCE_UPLOADED,
      createdAt: newDate(),
    });
  }

  static createClipUpdatedEvent(clipId: string, sourceId: string, companyId: string) {
    return new Event({
      id: randomUUID(),
      sourceId,
      companyId,
      clipId,
      type: ProcessingEvent.CLIP_UPDATED,
      createdAt: newDate(),
    });
  }
}
