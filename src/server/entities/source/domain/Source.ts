import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { newDate } from "@/utils/newDate";

export const SourceSchema = z.object({
  id: z.string(),
  companyId: z.string(),
  externalId: z.string(),
  name: z.string(),
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
    name: string;
    processing: boolean;
    url?: string;
    width?: number;
    height?: number;
    duration?: number;
    genre: string;
    clipLength: string;
    processingRangeStart: number;
    processingRangeEnd: number;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = id;
    this.companyId = companyId;
    this.externalId = externalId;
    this.name = name;
    this.processing = processing;
    this.url = url || null;
    this.width = width || null;
    this.height = height || null;
    this.duration = duration || null;
    this.genre = genre;
    this.clipLength = clipLength;
    this.processingRangeStart = processingRangeStart;
    this.processingRangeEnd = processingRangeEnd;
    this.tags = tags || [];
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toPrimitives() {
    return {
      id: this.id,
      companyId: this.companyId,
      externalId: this.externalId,
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
    name,
    genre,
    clipLength,
    processingRange,
    tags,
  }: {
    companyId: string;
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

  updateUrl(url: string) {
    this.url = url;
    this.updatedAt = new Date();
  }
}
