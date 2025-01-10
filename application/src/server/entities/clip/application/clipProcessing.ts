import { z } from "zod";
import { ClipRepository } from "../entities/clip/domain/ClipRepository";

export const FinishProcessingInputSchema = z.object({ id: z.string() });
type FinishProcessingInput = z.infer<typeof FinishProcessingInputSchema>;
export async function finishProcessing(
  repo: ClipRepository,
  input: FinishProcessingInput,
) {
  const theC = await repo.find(input.id);
  if (!theC) throw new Error("Clip not found");

  theC.finishProcessing();

  await repo.save(theC);
}
