import os
from pathlib import Path
from typing import Optional
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from processSource import processSource
from generateClip import generateClip

from clip.clipRepository import findClipById, finishClipProcessing
from createSuggestions import createSuggestions
from addSubtitlestoClip import addSubtitlestoClip
from extractWordsFromFile import extractWordsFromFile
from clip.Clip import Clip
from flask_server import flask_server
from source.Event import Event, EventType, createTranscriptionFinishedEvent
from source.eventRepository import saveEvent, getNextEvent
from s3FileHandlers import downloadFromS3, saveToS3
from suggestion.suggestionRepository import saveSuggestions
from startTranscription import startTranscription
from source.sourceRepository import (
    findSourceById,
    getClipWords,
    saveSource,
    saveTranscription,
)

env = os.environ["ENV"]
if True or env == "dev":
    load_dotenv()

dbUrl = os.environ["DATABASE_URL"]
engine = create_engine(dbUrl)


def start():
    # We start a new thread for a server that will just return a status ok
    flask_server()

    # We will keep polling the database for new events to process
    while True:
        with Session(engine) as session:
            print("Fetching event to process")
            event = getNextEvent(session)

            if event is None:
                print("No more events to process")
            else:
                handleEvent(session, event)

            session.commit()

        sleep(10)


def handleEvent(
    session: Session,
    event: Event,
):
    path = f"{os.environ["FILES_PATH"]}/{str(event.sourceId)}"

    if env == "prod":
        downloadFromS3(event.sourceId, path)

    if event.type == EventType.SOURCE_UPLOADED:
        source = findSourceById(session, event.sourceId)
        if source is None:
            return

        clip: Optional[Clip] = None
        if event.clipId is not None:
            clip = findClipById(session, event.clipId)

        print(f"New source {source.id}")

        startTranscription(source)

        newEv = createTranscriptionFinishedEvent(source)
        saveEvent(session, newEv)
    elif event.type == EventType.TRANSCRIPTION_FINISHED:
        source = findSourceById(session, event.sourceId)
        if source is None:
            return

        clip: Optional[Clip] = None
        if event.clipId is not None:
            clip = findClipById(session, event.clipId)

        print(f"Processing source after transcription {source.id}")
        if not Path(f"{path}/transcription.json").exists():
            newEv = createTranscriptionFinishedEvent(source)
            saveEvent(session, newEv)
            return

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

        suggestions = createSuggestions(source, words)
        saveSuggestions(session, suggestions)
    elif event.type == EventType.CLIP_UPDATED:
        source = findSourceById(session, event.sourceId)
        if source is None:
            return

        clip: Optional[Clip] = None
        if event.clipId is not None:
            clip = findClipById(session, event.clipId)

        if clip is None:
            return

        print(f"Processing clip {event.clipId}")

        generateClip(clip, source, path)

        words = getClipWords(session, clip.range, source.id)
        addSubtitlestoClip(path, clip, words)

        finishClipProcessing(session, clip.id)

    if env == "prod":
        saveToS3(event.sourceId, path)


# We start the main loop that will handling the events
start()
