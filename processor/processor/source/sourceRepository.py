from sqlalchemy.orm import Session

from models import Source as SourceModal, SourceTag as SourceTagModal
from source.Source import Source


def findSourceById(session: Session, sourceId: str):
    source = session.query(SourceModal).filter(SourceModal.id == sourceId).first()

    if source is None:
        return None

    tags = session.query(SourceTagModal).filter(SourceTagModal.sourceId == source.id).all()

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
