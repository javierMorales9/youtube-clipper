from sqlalchemy import text
from sqlalchemy.orm import Session

from models import ProcessingEvent
from entities.event.Event import Event

class PostgresEventRepository():
    def __init__(
        self,
        session: Session,
    ):
        self.session = session

    def saveEvent(self, event: Event):
        processing_event = ProcessingEvent(
            id=event.id,
            companyId=event.companyId,
            sourceId=event.sourceId,
            clipId=event.clipId,
            type=event.type,
            startProcessingAt=event.startProcessingAt,
            createdAt=event.createdAt,
            fnishedAt=None,
        )

        self.session.merge(processing_event)

    def getNextEvent(self):
        # In order to support concurrency polling and not having everyone waiting,
        # we use postgresql's SKIP LOCKED feature.
        # See
        #   https://www.postgresql.org/docs/17/sql-select.html#:~:text=such%20a%20case.-,The,-Locking%20Clause
        #   https://leontrolski.github.io/postgres-as-queue.html
        exec = self.session.execute(
            text(
                """
            UPDATE processing_event
            SET finished_at = now()
            WHERE id = (
              SELECT id
              FROM processing_event
              WHERE
                finished_at IS NULL
                AND (start_processing_at IS NULL OR start_processing_at < now())
              ORDER BY id
              FOR UPDATE SKIP LOCKED
              LIMIT 1
            )
            RETURNING id, company_id, source_id, clip_id, type, created_at, start_processing_at
        """
            )
        )
        result = exec.all()

        if len(result) == 0:
            return None
        else:
            data = result[0]
            id = data[0]
            company_id = data[1]
            source_id = data[2]
            clip_id = data[3]
            eventType = data[4]
            created_at = data[5]
            start_processing_at = data[6]

            event = Event(
                id=id,
                companyId=company_id,
                sourceId=source_id,
                clipId=clip_id,
                type=eventType,
                createdAt=created_at,
                startProcessingAt=start_processing_at,
            )

            return event

