from sqlalchemy.orm import Session

from models import Source as SourceModal
from source.Source import Source


def findSourceById(session: Session, sourceId: str):
    source = session.query(SourceModal).filter(SourceModal.id == sourceId).first()

    if source is None:
        return None

    return parseSource(source)

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

    session.add(sourceModel)

def parseSource(sourceModel: SourceModal):
    return Source(
        id=str(sourceModel.id),
        externalId=sourceModel.externalId,
        name=sourceModel.name,
        processing=sourceModel.processing,
        url=sourceModel.url,
        width=sourceModel.width,
        height=sourceModel.height,
        duration=sourceModel.duration,
        createdAt=sourceModel.createdAt,
        updatedAt=sourceModel.updatedAt,
    )
