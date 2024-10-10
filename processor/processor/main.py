import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from enum import Enum

from models import ProcessingEvent
from processSource import processSource
from generateClip import generateClip

from clip.clipRepository import findClipById, finishClipProcessing
from source.sourceRepository import findSourceById, saveSource


class EventType(str, Enum):
    SOURCE_UPLOADED = "source_uploaded"
    CLIP_UPDATED = "clip_updated"


env = os.environ["ENV"]
if env == "dev":
    load_dotenv()
    
dbUrl = os.environ["DATABASE_URL"]
filesPath = os.environ["FILES_PATH"]
print(f"Connecting to database at {dbUrl}")
engine = create_engine(dbUrl)


def loop():
    # We will keep polling the database for new events to process
    while True:
        with Session(engine) as session:
            print("Fetching event to process")
            # In order to support concurrency polling and not having everyone waiting,
            # we use postgresql's SKIP LOCKED feature.
            # See https://www.2ndquadrant.com/en/blog/what-is-select-skip-locked-for-in-postgresql-9-5/
            exec = session.execute(
                text(
                    """
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
            """
                )
            )
            result = exec.all()

            if len(result) == 0:
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

                if event.type == EventType.SOURCE_UPLOADED:
                    print(f"Processing source {event.sourceId}")
                    if event.sourceId is not None:
                        source = findSourceById(session, event.sourceId)
                        if source is not None:
                            duration, resolution = processSource(event.sourceId, filesPath)

                            source.processing = False
                            source.duration = duration

                            # Resolution format is "1920x1080"
                            resolution = resolution.split("x")
                            if len(resolution) != 2:
                                print("Invalid resolution")
                            else:
                                source.width = int(resolution[0])
                                source.height = int(resolution[1])

                            saveSource(session, source)
                elif event.type == EventType.CLIP_UPDATED:
                    print(f"Processing clip {event.clipId}")
                    if event.clipId is not None and event.sourceId is not None:
                        clip = findClipById(session, event.clipId)
                        source = findSourceById(session, event.sourceId)
                        if clip is not None and source is not None:
                            generateClip(clip, source, filesPath)
                            finishClipProcessing(session, event.clipId)

            session.commit()

        # Sleep for 10 seconds before polling again
        sleep(10)


loop()
