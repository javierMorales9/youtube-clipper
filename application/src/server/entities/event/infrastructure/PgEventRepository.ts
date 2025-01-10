import { Db } from "@/server/db";
import { EventRepository } from "@/server/entities/event/domain/EventRepository";
import { Event } from "@/server/entities/event/domain/Event";
import { processingEvent } from "@/server/db/schema";

export class PgEventRepository implements EventRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async saveEvent(event: Event): Promise<void> {
    await this.db.insert(processingEvent).values(event.toPrimitives());
  }
}
