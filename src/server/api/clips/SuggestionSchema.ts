import z from "zod";

export const SuggestionSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  range: z.object({
    start: z.number(),
    end: z.number(),
  }),
});

export type Suggestion = z.infer<typeof SuggestionSchema>;
