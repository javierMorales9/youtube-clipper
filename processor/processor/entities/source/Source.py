from enum import Enum
from datetime import datetime
from typing import Optional


class SourceOrigin(str, Enum):
    UPLOAD = "upload"
    URL = "url"


class Source:
    def __init__(
        self,
        id: str,
        companyId: str,
        externalId: str,
        origin: SourceOrigin,
        name: str,
        processing: bool,
        url: Optional[str],
        width: Optional[int],
        height: Optional[int],
        duration: Optional[float],
        genre: Optional[str],
        clipLength: Optional[str],
        processingRangeStart: Optional[int],
        processingRangeEnd: Optional[int],
        tags: list[str],
        createdAt: datetime,
        updatedAt: datetime,
    ):
        self.id = id
        self.companyId = companyId
        self.externalId = externalId
        self.origin = origin
        self.name = name
        self.processing = processing
        self.url = url
        self.width = width
        self.height = height
        self.duration = duration
        self.genre = genre
        self.clipLength = clipLength
        self.processingRangeStart = processingRangeStart
        self.processingRangeEnd = processingRangeEnd
        self.tags = tags
        self.createdAt = createdAt
        self.updatedAt = updatedAt

    def __repr__(self):
        return f"<Source(id={self.id}, name={self.name}, origin={self.origin}, processing={self.processing}, url={self.url}, width={self.width}, height={self.height}, duration={self.duration}, genre={self.genre}, clipLength={self.clipLength}, processingRangeStart={self.processingRangeStart}, processingRangeEnd={self.processingRangeEnd}, tags={self.tags}, createdAt={self.createdAt}, updatedAt={self.updatedAt})>"

    def finishProcessing(self, duration: float, width: int, height: int):
        self.processing = False
        self.duration = duration
        self.width = width
        self.height = height
