import { Suggestion } from "./Suggestion";

export interface SuggestionRepository {
  getSourceSuggestions(sourceId: string): Promise<Suggestion[]>;
}
