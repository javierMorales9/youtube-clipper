import { Source, Word } from "./Source";

export interface SourceRepository {
  getSources(companyId: string): Promise<Source[]>;
  getSource(id: string): Promise<Source | null>;
  saveSource(source: Source): Promise<void>;
  getClipWords (
    id: string,
    rage: { start: number; end: number },
  ): Promise<Word[]>;
}
