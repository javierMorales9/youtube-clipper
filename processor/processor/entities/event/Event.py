from enum import Enum
from datetime import datetime
from typing import Optional
import uuid
from utils import newDate
from entities.source.Source import Source
from datetime import timedelta


class EventType(str, Enum):
    SOURCE_UPLOADED = "source_uploaded"
    TRANSCRIPTION_FINISHED = "transcription_finished"
    CLIP_UPDATED = "clip_updated"

def createTranscriptionFinishedEvent(source: Source):
    return Event(
        id=None,
        companyId=source.companyId,
        sourceId=source.id,
        clipId=None,
        type=EventType.TRANSCRIPTION_FINISHED,
        createdAt=newDate(),
        startProcessingAt=newDate() + timedelta(minutes=8),
    )


class Event:
    def __init__(
        self,
        id: Optional[str],
        companyId: str,
        sourceId: str,
        clipId: Optional[str],
        type: EventType,
        startProcessingAt: Optional[datetime],
        createdAt: datetime,
    ):
        self.id = id if id is not None else str(uuid.uuid4())
        self.companyId = companyId
        self.sourceId = sourceId
        self.clipId = clipId
        self.type = type
        self.startProcessingAt = startProcessingAt
        self.createdAt = createdAt

    def __repr__(self):
        return f"<Event {self.id} {self.type}>"
