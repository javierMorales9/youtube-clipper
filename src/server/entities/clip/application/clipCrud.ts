import { z } from "zod";
import { ClipRepository } from "@/server/entities/clip/domain/ClipRepository";
import { Clip, ClipType } from "@/server/entities/clip/domain/Clip";
import { EventRepository } from "@/server/entities/event/domain/EventRepository";
import { Event } from "@/server/entities/event/domain/Event";

export const FindInputSchema = z.object({ id: z.string() });
type FindInput = z.infer<typeof FindInputSchema>;
export async function find(repo: ClipRepository, input: FindInput) {
  const clip = await repo.find(input.id);

  if (!clip) return null;

  return clip.toPrimitives();
}

export const FromSourceInputSchema = z.object({ sourceId: z.string() });
type FromSourceInput = z.infer<typeof FromSourceInputSchema>;
export async function fromSource(repo: ClipRepository, input: FromSourceInput) {
  const clips = await repo.fromSource(input.sourceId);
  return clips.map((clip) => clip.toPrimitives());
}

export const CreateNewInputSchema = z.object({
  sourceId: z.string(),
  start: z.number(),
  end: z.number(),
});
type CreateNewInput = z.infer<typeof CreateNewInputSchema>;
export async function createNew(
  repo: ClipRepository,
  companyId: string,
  input: CreateNewInput,
) {
  const clip = Clip.new({ ...input, companyId: companyId });

  repo.save(clip);

  return clip.toPrimitives();
}

export async function save(
  repo: ClipRepository,
  eventRepo: EventRepository,
  companyId: string,
  input: ClipType,
) {
  console.log("Saving clip", JSON.stringify(input, null, 2));

  const clip = await repo.find(input.id);

  if (!clip) {
    throw new Error("Clip not found");
  }

  clip.update(input);
  await repo.save(clip);

  const event = Event.createClipUpdatedEvent(
    input.id,
    input.sourceId,
    companyId,
  );
  await eventRepo.saveEvent(event);
}