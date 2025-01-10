import { Clip } from "./Clip";

export interface ClipRepository {
  find(id: string): Promise<Clip | null>;
  fromSource(sourceId: string): Promise<Clip[]>;
  save(clip: Clip): Promise<void>;
}
