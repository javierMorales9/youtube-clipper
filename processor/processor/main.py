from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from time import sleep

from enum import Enum

from models import ProcessingEvent
from processSource import processSource
from clipUpdated import clipUpdated

from clip.clipRepository import findClipById
from source.sourceRepository import findSourceById

class EventType(Enum):
    SOURCE_UPLOADED = 'source_uploaded'
    CLIP_UPDATED = 'clip_updated'

engine = create_engine("postgresql://user:pass@localhost:5432/db")#, echo=True)

def loop():
    # We will keep polling the database for new events to process
    while True:
        with Session(engine) as session:
            print("Fetching event to process")
            # In order to support concurrency polling and not having everyone waiting, 
            # we use postgresql's SKIP LOCKED feature.
            # See https://www.2ndquadrant.com/en/blog/what-is-select-skip-locked-for-in-postgresql-9-5/
            exec = session.execute(text("""
                UPDATE processing_event
                SET finished_at = now()
                WHERE id = (
                  SELECT id FROM processing_event
                  WHERE finished_at IS NULL
                  ORDER BY id
                  FOR UPDATE SKIP LOCKED
                  LIMIT 1
                )
                RETURNING id, source_id, clip_id, type, created_at
            """))
            result = exec.all()

            if(len(result) == 0):
                print("No more events to process")
            else:
                data = result[0]
                id = data[0]
                source_id = data[1]
                clip_id = data[2]
                eventType = data[3]
                created_at = data[4]

                event = ProcessingEvent(
                    id=id,
                    sourceId=source_id,
                    clipId=clip_id,
                    type=eventType,
                    createdAt=created_at,
                )

                if(event.type == EventType.SOURCE_UPLOADED):
                    if event.sourceId is not None:
                        duration, resolution = processSource(event.sourceId)
                        # Update the source in the database
                elif(event.type == EventType.CLIP_UPDATED):
                    if(event.clipId is not None and event.sourceId is not None):
                        clip = findClipById(session, event.clipId)
                        source = findSourceById(session, event.sourceId)
                        if clip is not None and source is not None:
                            clipUpdated(clip, source)

            session.commit()

        #Sleep for 10 seconds before polling again
        sleep(10)

loop()
