import json
from sqlalchemy import column, func, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session

from models import (
    Source as SourceModal,
    SourceTag as SourceTagModal,
    SourceTranscription,
)
from extractWordsFromFile import Word
from clip.Clip import Range
from source.Source import Source


def findSourceById(session: Session, sourceId: str):
    source = session.query(SourceModal).filter(SourceModal.id == sourceId).first()

    if source is None:
        return None

    tags = (
        session.query(SourceTagModal).filter(SourceTagModal.sourceId == source.id).all()
    )

    return parseSource(source, tags)


def saveSource(session: Session, source: Source):
    sourceModel = SourceModal(
        id=source.id,
        externalId=source.externalId,
        name=source.name,
        processing=source.processing,
        url=source.url,
        width=source.width,
        height=source.height,
        duration=source.duration,
        createdAt=source.createdAt,
        updatedAt=source.updatedAt,
    )
    session.merge(sourceModel)


def saveTranscription(session: Session, sourceId: str, words: list[Word]):
    transcription = SourceTranscription(
        sourceId=sourceId,
        transcription=json.dumps(words),
    )
    session.merge(transcription)


def getClipWords(session: Session, clipRange: Range, sourceId: str):
    # The words are in the SourceTranscription table. In a jsonb field called transcription
    # The jsonb field has the following structure:
    # [
    #     { "word": "This", "start": 0, "end": 100 },
    #     { "word": "is", "start": 100, "end": 200 },
    #     ...
    # ]
    # Apply a query similar to this one
    #
    # SELECT word -> 'word', word -> 'start', word -> 'end'
    # FROM source_transcription, jsonb_array_elements(source_transcription.transcription) AS word
    # WHERE 
	#   source_transcription.source_id = sourceId
	#   AND CAST((word -> 'start') AS INTEGER) > range.start
	#   AND CAST((word -> 'end') AS INTEGER) < range.end
    #;
    #
    # See the following link for more info about jsonb arrays and how to query them
    # https://hevodata.com/learn/query-jsonb-array-of-objects/
    col = column("col", type_=JSONB)
    words = (
        session.query(col["word"], col["start"], col["end"])
        .select_from(
            SourceTranscription,
            func.jsonb_array_elements(SourceTranscription.transcription).alias("col"),
        )
        .filter(
            SourceTranscription.sourceId == sourceId,
            col["start"].cast(Integer) > clipRange.start * 1000,
            col["end"].cast(Integer) < clipRange.end * 1000,
        )
    ).all()

    result: list[Word] = []
    for word in words:
        result.append(
            Word(
                word=word[0],
                start=word[1],
                end=word[2],
            )
        )

    return result

def parseSource(sourceModel: SourceModal, tags: list[SourceTagModal]):
    return Source(
        id=str(sourceModel.id),
        externalId=sourceModel.externalId,
        name=sourceModel.name,
        processing=sourceModel.processing,
        url=sourceModel.url,
        width=sourceModel.width,
        height=sourceModel.height,
        duration=sourceModel.duration,
        genre=sourceModel.genre,
        clipLength=sourceModel.clipLength,
        processingRangeStart=sourceModel.processingRangeStart,
        processingRangeEnd=sourceModel.processingRangeEnd,
        tags=[tag.tag for tag in tags],
        createdAt=sourceModel.createdAt,
        updatedAt=sourceModel.updatedAt,
    )
