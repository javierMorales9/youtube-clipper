import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { newDate } from "@/utils/newDate";

export enum SourceOrigin {
  Upload = "upload",
  URL = "url",
}

export const SourceSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  externalId: z.string(),
  name: z.string(),
  origin: z.nativeEnum(SourceOrigin),
  processing: z.boolean(),
  url: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  genre: z.string().nullable(),
  clipLength: z.string().nullable(),
  processingRangeStart: z.number().nullable(),
  processingRangeEnd: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SourceType = z.infer<typeof SourceSchema>;

export type Word = { word: string; start: number; end: number };

export class Source {
  readonly id: string;
  private companyId: string;
  public externalId: string;
  private origin: SourceOrigin;
  private name: string;
  private processing: boolean;
  private url: string | null;
  private width: number | null;
  private height: number | null;
  private duration: number | null;
  private genre: string | null;
  private clipLength: string | null;
  private processingRangeStart: number | null;
  private processingRangeEnd: number | null;
  private createdAt: Date;
  private updatedAt: Date;

  private tags: string[];

  constructor({
    id,
    companyId,
    externalId,
    origin,
    name,
    processing,
    url,
    width,
    height,
    duration,
    genre,
    clipLength,
    processingRangeStart,
    processingRangeEnd,
    tags,
    createdAt,
    updatedAt,
  }: {
    id: string;
    companyId: string;
    externalId: string;
    origin: SourceOrigin;
    name: string;
    processing: boolean;
    url?: string;
    width?: number;
    height?: number;
    duration?: number;
    genre?: string;
    clipLength?: string;
    processingRangeStart?: number;
    processingRangeEnd?: number;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.origin = origin;
    this.companyId = companyId;
    this.externalId = externalId;
    this.name = name;
    this.processing = processing;
    this.url = url || null;
    this.width = width || null;
    this.height = height || null;
    this.duration = duration || null;
    this.genre = genre || null;
    this.clipLength = clipLength || null;
    this.processingRangeStart = processingRangeStart || null;
    this.processingRangeEnd = processingRangeEnd || null;
    this.tags = tags || [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toPrimitives() {
    return {
      id: this.id,
      companyId: this.companyId,
      externalId: this.externalId,
      origin: this.origin,
      name: this.name,
      processing: this.processing,
      url: this.url,
      width: this.width,
      height: this.height,
      duration: this.duration,
      genre: this.genre,
      clipLength: this.clipLength,
      processingRangeStart: this.processingRangeStart,
      processingRangeEnd: this.processingRangeEnd,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  static newSource({
    companyId,
    origin,
    url,
    name,
    genre,
    clipLength,
    processingRange,
    tags,
  }: {
    companyId: string;
    origin: SourceOrigin;
    url?: string,
    name: string;
    genre: string;
    clipLength: string;
    processingRange: [number, number];
    tags?: string[]
  }) {
    const id = uuidv4();

    return new Source({
      id,
      companyId: companyId,
      origin: origin,
      url: url || "",
      name: name,
      processing: true,
      externalId: "",
      genre: genre,
      clipLength: clipLength,
      processingRangeStart: Math.floor(processingRange[0]),
      processingRangeEnd: Math.floor(processingRange[1]),
      createdAt: newDate(),
      updatedAt: newDate(),
      tags: tags,
    });
  }

  setExternalId(externalId: string) {
    this.externalId = externalId;
  }
}
