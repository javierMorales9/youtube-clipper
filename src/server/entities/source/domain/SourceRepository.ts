import { Company } from "../../company/domain/Company";
import { Source, Word } from "./Source";

interface SourceRepository {
  getSources(company: Company): Promise<Source[]>;
  getSource(id: string): Promise<Source | null>;
  saveSource(source: Source): Promise<void>;
  getClipWords(id: string): Promise<Word[]>;
}
