import { z } from "zod";
import { SuggestionRepository } from "@/server/entities/suggestion/domain/SuggestionRepository";

export const FromSourceInputSchema = z.object({ sourceId: z.string() });
export type FromSourceInput = z.infer<typeof FromSourceInputSchema>;
export async function fromSource(
  repo: SuggestionRepository,
  input: FromSourceInput,
) {
  const sourceId = input.sourceId;

  const result = await repo.getSourceSuggestions(sourceId);

  return result.map((r) => r.toPrimitives());
}
