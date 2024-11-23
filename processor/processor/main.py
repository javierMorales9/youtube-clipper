import os
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from enum import Enum

from models import ProcessingEvent
from processSource import processSource
from generateClip import generateClip

from clip.clipRepository import findClipById, finishClipProcessing
from createSuggestions import createSuggestions
from addSubtitlestoClip import addSubtitlestoClip
from extractWordsFromFile import extractWordsFromFile
from clip.Clip import Clip
from source.Source import Source
from s3FileHandlers import downloadFromS3, saveToS3
from suggestion.suggestionRepository import saveSuggestions
from startTranscription import startTranscription
from source.sourceRepository import findSourceById, getClipWords, saveSource, saveTranscription


class EventType(str, Enum):
    SOURCE_UPLOADED = "source_uploaded"
    TRANSCRIPTION_FINISHED = "transcription_finished"
    CLIP_UPDATED = "clip_updated"


env = os.environ["ENV"]
if env == "dev":
    load_dotenv()

dbUrl = os.environ["DATABASE_URL"]
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

                if event.sourceId is not None:
                    source = findSourceById(session, event.sourceId)
                    if source is not None:
                        clip: Optional[Clip] = None
                        if event.clipId is not None:
                            clip = findClipById(session, event.clipId)

                        if env == "prod":
                            downloadFromS3(source.id, path)

                        handleEvent(event, source, clip)

                        if env == "prod":
                            saveToS3(source.id, path)

            session.commit()

        sleep(10)

def handleEvent(event: ProcessingEvent, source: Source, clip: Optional[Clip] = None):
    path = f"{os.environ["FILES_PATH"]}/{str(source.id)}"

    if event.type == EventType.SOURCE_UPLOADED:
        print(f"New source {source.id}")
        startTranscription(source)

    if event.type == EventType.TRANSCRIPTION_FINISHED:
        print(f"Processing source after transcription {source.id}")

        duration, resolution = processSource(path)

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

        words = extractWordsFromFile(path)
        saveTranscription(session, source.id, words)

        suggestions = createSuggestions(source)
        saveSuggestions(session, suggestions)
    elif clip is not None and event.type == EventType.CLIP_UPDATED:
        print(f"Processing clip {event.clipId}")

        generateClip(clip, source, path)

        words = getClipWords(session, clip.range, source.id)
        addSubtitlestoClip(path, clip, words)

        finishClipProcessing(session, clip.id)

# loop()

print("Don't forget to delete this print and call loop() instead")
with Session(engine) as session:
    clipId = "c5e37d43-28d0-43a4-a3fc-2b2da8d147de"
    clip = findClipById(session, clipId)
    if not clip:
        raise Exception("Clip not found")

    source = findSourceById(session, clip.sourceId)
    if not source:
        raise Exception("Source not found")

    path = f"../public/files/{source.id}"

    #words = extractWords(path)
    #saveTranscription(session, source.id, words)

    words = getClipWords(session, clip.range, source.id)

    #generateClip(clip, source, path)
    addSubtitlestoClip(path, clip, words)
    session.commit()
