from typing import Protocol

from entities.event.domain.Event import Event

class EventRepository(Protocol):
    def saveEvent(self, event: Event): ...
    def getNextEvent(self) -> (Event | None): ...
