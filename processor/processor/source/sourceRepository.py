from sqlalchemy.orm import Session

from models import Source as SourceModal
from source.Source import Source


def findSourceById(session: Session, sourceId: str):
    source = session.query(SourceModal).filter(SourceModal.id == sourceId).first()

    if source is None:
        return None

    return parseSource(source)


def parseSource(sourceModel: SourceModal):
    return Source(
        id=sourceModel.id,
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
