import { Suggestion } from "./Suggestion";

export interface SuggestionRepository {
  getSourceSuggestions(sourceId: string): Promise<Suggestion[]>;
  find(id: string): Promise<Suggestion | null>;
  delete(id: string): Promise<void>;
}
