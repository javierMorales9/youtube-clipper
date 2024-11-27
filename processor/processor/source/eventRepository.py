from sqlalchemy.orm import Session

from models import ProcessingEvent

def saveEvent(session: Session, event: ProcessingEvent):
    session.merge(event)
