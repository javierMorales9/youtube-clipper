from typing import Optional
from sqlalchemy import ForeignKey, PrimaryKeyConstraint, String, DateTime, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class Source(Base):
    __tablename__ = "source"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    externalId: Mapped[str] = mapped_column(String(256), name="external_id")
    name: Mapped[str] = mapped_column(String(256))
    processing: Mapped[bool] = mapped_column(Boolean, default=False)
    url: Mapped[Optional[str]] = mapped_column(String(256))
    width: Mapped[Optional[int]]
    height: Mapped[Optional[int]]
    duration: Mapped[Optional[float]]

    createdAt: Mapped[datetime] = mapped_column(DateTime, name="created_at", nullable=False)
    updatedAt: Mapped[datetime] = mapped_column(DateTime, name="updated_at", nullable=False)

    def __repr__(self) -> str:
        return f"Source(id={self.id!r}, externalId={self.externalId!r}, name={self.name!r})"

class Suggestion(Base):
    __tablename__ = "suggestion"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    sourceId: Mapped[str] = mapped_column(ForeignKey("source.id"), name="source_id", nullable=False)
    name: Mapped[str] = mapped_column(String(256), default="")
    description: Mapped[Optional[str]] = mapped_column(String(256))
    start: Mapped[int] = mapped_column(nullable=False)
    end: Mapped[int] = mapped_column(nullable=False)

class Clip(Base):
    __tablename__ = "clip"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    sourceId: Mapped[str] = mapped_column(ForeignKey("source.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(256), default="")
    url: Mapped[Optional[str]] = mapped_column(String(256))
    processing: Mapped[bool] = mapped_column(Boolean, nullable=False)
    width: Mapped[int] = mapped_column(nullable=False)
    height: Mapped[int] = mapped_column(nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, name="created_at")
    updatedAt: Mapped[datetime] = mapped_column(DateTime, name="updated_at")

class ClipRange(Base):
    __tablename__ = "clip_range"

    clipId: Mapped[str] = mapped_column(ForeignKey("clip.id"), name="clip_id", nullable=False)
    start: Mapped[int] = mapped_column(nullable=False)
    end: Mapped[int] = mapped_column(nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("clip_id", "start", "end"),
    )

class ClipSection(Base):
    __tablename__ = "clip_section"

    order: Mapped[int] = mapped_column(nullable=False)
    clipId: Mapped[str] = mapped_column(ForeignKey("clip.id"), name="clip_id", nullable=False)
    start: Mapped[int] = mapped_column(nullable=False)
    end: Mapped[int] = mapped_column(nullable=False)
    display: Mapped[str] = mapped_column(String(256), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("order", "clip_id"),
    )

class SectionFragment(Base):
    __tablename__ = "section_fragment"

    sectionOrder: Mapped[int] = mapped_column(name="section_order", nullable=False)
    clipId: Mapped[str] = mapped_column(ForeignKey("clip.id"), name="clip_id", nullable=False)
    x: Mapped[int] = mapped_column(nullable=False)
    y: Mapped[int] = mapped_column(nullable=False)
    width: Mapped[int] = mapped_column(nullable=False)
    height: Mapped[int] = mapped_column(nullable=False)
    
    __table_args__ = (
        PrimaryKeyConstraint("section_order", "clip_id"),
    )

class ProcessingEvent(Base):
    __tablename__ = "processing_event"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    sourceId: Mapped[Optional[str]] = mapped_column(ForeignKey("source.id"), name="source_id")
    clipId: Mapped[Optional[str]] = mapped_column(ForeignKey("clip.id"), name="clip_id")
    type: Mapped[str] = mapped_column(String(256), nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, name="created_at", nullable=False)
    finishedAt: Mapped[Optional[datetime]] = mapped_column(DateTime, name="finished_at")
    error: Mapped[Optional[str]]
