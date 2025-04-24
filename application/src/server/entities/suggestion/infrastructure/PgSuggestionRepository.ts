import { SuggestionRepository } from "@/server/entities/suggestion/domain/SuggestionRepository";
import { Suggestion } from "@/server/entities/suggestion/domain/Suggestion";
import { Db } from "@/server/db";
import { SuggestionModel, suggestion } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export class PgSuggestionRepository implements SuggestionRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async getSourceSuggestions(sourceId: string): Promise<Suggestion[]> {
    const result = await this.db
      .select()
      .from(suggestion)
      .where(eq(suggestion.sourceId, sourceId));

    return parseSuggestions(result);
  }

  async find(id: string): Promise<Suggestion | null> {
    const result = await this.db.query.suggestion.findFirst({
      where: eq(suggestion.id, id)
    });

    if(!result) return null;

    return parseSuggestion(result);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(suggestion).where(eq(suggestion.id, id));
  }
}

function parseSuggestion(source: SuggestionModel): Suggestion {
  return new Suggestion({
    id: source.id,
    companyId: source.companyId,
    sourceId: source.sourceId,
    name: source.name,
    description: source.description,
    range: {
      start: source.start,
      end: source.end,
    },
  });
}

function parseSuggestions(suggestions: SuggestionModel[]): Suggestion[] {
  return suggestions.map((suggestion) => parseSuggestion(suggestion));
}
