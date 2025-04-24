import { z } from "zod";

export const SuggestionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional().nullable(),
  range: z.object({
    start: z.number(),
    end: z.number(),
  }),
});

export type SuggestionType = z.infer<typeof SuggestionSchema>;

export class Suggestion {
  readonly id: string;
  private companyId: string;
  private sourceId: string;
  private name: string;
  private description: string | null;
  private range: { start: number; end: number };

  constructor({
    id,
    companyId,
    sourceId,
    name,
    description,
    range,
  }: {
    id: string;
    companyId: string;
    sourceId: string;
    name: string;
    description: string | null;
    range: { start: number; end: number };
  }) {
    this.id = id;
    this.companyId = companyId;
    this.sourceId = sourceId;
    this.name = name;
    this.description = description;
    this.range = range;
  }

  clipData() {
    return {
      companyId: this.companyId,
      sourceId: this.sourceId,
      name: this.name,
      start: this.range.start,
      end: this.range.end,
    }
  }

  toPrimitives() {
    return {
      id: this.id,
      companyId: this.companyId,
      sourceId: this.sourceId,
      name: this.name,
      description: this.description,
      range: this.range,
    };
  }
}
