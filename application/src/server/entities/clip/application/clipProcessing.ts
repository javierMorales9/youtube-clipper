import { z } from "zod";
import { ClipRepository } from "../domain/ClipRepository";
import { Store } from "../../source/domain/Store";

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

export const DownloadInputSchema = z.object({ id: z.string() });
type DownloadInput = z.infer<typeof DownloadInputSchema>;
export async function download(
  repo: ClipRepository,
  store: Store,
  input: DownloadInput,
) {
  const theC = await repo.find(input.id);
  if (!theC) throw new Error("Clip not found");

  return store.getClipFileURL(theC.sourceId, theC.id);
}
