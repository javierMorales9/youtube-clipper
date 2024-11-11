import z from "zod";

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

