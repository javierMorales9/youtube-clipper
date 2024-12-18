import { Event } from "@/server/entities/event/domain/Event";

export interface EventRepository {
  saveEvent(event: Event): Promise<void>;
}
