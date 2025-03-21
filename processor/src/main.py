import json
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from flask_server import flask_server

from entities.event.domain.Event import EventType, createTranscriptionInProgressEvent

from entities.event.infrastructure.postgresEventRepository import (
    PostgresEventRepository,
)
from entities.source.infrastructure.postgresSourceRepository import (
    PostgresSourceRepository,
)
from entities.clip.infrastructure.postgresClipRepository import PostgresClipRepository
from entities.suggestion.infrastructure.postgresSuggestionRepository import (
    PostgresSuggestionRepository,
)

from entities.shared.infrastructure.amazonTranscriptionHandler import (
    AmazonTranscriptionHandler,
)
from entities.shared.infrastructure.s3FileHandler import S3FileHandler
from entities.shared.infrastructure.openAiModel import OpenAiModel
from entities.shared.infrastructure.prodSystem import ProdSystem

from application.generateClip.generateClip import generateClip
from application.processSource.processSource import processSource
from application.startTranscription.startTranscription import startTranscription
from entities.shared.infrastructure.prodDateCreator import ProdDateCreator
from entities.shared.infrastructure.prodvideoDownloader import ProdVideoDownloader


def main():
    env = os.environ["ENV"]
    if True or env == "dev":
        load_dotenv()

    dbUrl = os.environ["DATABASE_URL"]
    engine = create_engine(dbUrl)

    # We start a new thread for a server that will just return a status ok
    flask_server()

    # We will keep polling the database for new events to process
    while True:
        with Session(engine) as session:
            eventRepo = PostgresEventRepository(session)
            sourceRepo = PostgresSourceRepository(session)
            suggestionRepo = PostgresSuggestionRepository(session)
            clipRepo = PostgresClipRepository(session)

            print("Checking for new events")
            event = eventRepo.getNextEvent()

            if event is not None:
                if event.type == EventType.SOURCE_UPLOADED:
                    sys = ProdSystem(event.sourceId)
                    fileHandler = S3FileHandler(
                        sys, event.sourceId, uploadBaseFiles=True
                    )
                    transcriptionHandler = AmazonTranscriptionHandler(sys)
                    videoDownloader = ProdVideoDownloader(sys)
                    dateCreator = ProdDateCreator()

                    startTranscription(
                        eventRepo,
                        sourceRepo,
                        sys,
                        fileHandler,
                        transcriptionHandler,
                        videoDownloader,
                        dateCreator,
                        event,
                    )
                elif event.type == EventType.TRANSCRIPTION_IN_PROGRESS:
                    sys = ProdSystem(event.sourceId)
                    fileHandler = S3FileHandler(sys, event.sourceId)
                    dateCreator = ProdDateCreator()
                    transcriptionHandler = AmazonTranscriptionHandler(sys)
                    aiModel = OpenAiModel(sys)

                    source = sourceRepo.findSourceById(event.sourceId)
                    if source is None:
                        return

                    if not fileHandler.checkIfFilesExist("transcription.json"):
                        print("Transcription not ready yet")
                        newEv = createTranscriptionInProgressEvent(
                            source, dateCreator.newDate()
                        )
                        eventRepo.saveEvent(newEv)
                        return

                    processSource(
                        sourceRepo,
                        suggestionRepo,
                        sys,
                        fileHandler,
                        aiModel,
                        source,
                    )
                elif event.type == EventType.CLIP_UPDATED:
                    sys = ProdSystem(event.sourceId)
                    fileHandler = S3FileHandler(sys, event.sourceId)

                    generateClip(sourceRepo, clipRepo, sys, fileHandler, event)

            session.commit()

        sleep(10)


# main()

load_dotenv()
dbUrl = os.environ["DATABASE_URL"]
engine = create_engine(dbUrl)

sourceId = "b218762a-714b-4916-b857-f00f11fd8c5e"

sys = ProdSystem(sourceId)
aiModel = OpenAiModel(sys)

words = aiModel.transcribe()

json.dump(words, open(sys.path("transcription_alt.json"), "w"), indent=2)

"""
with Session(engine) as session:
    eventRepo = PostgresEventRepository(session)
    sourceRepo = PostgresSourceRepository(session)
    suggestionRepo = PostgresSuggestionRepository(session)
    clipRepo = PostgresClipRepository(session)

    sys = ProdSystem(sourceId)
    fileHandler = S3FileHandler(sys, sourceId)
    dateCreator = ProdDateCreator()
    suggestionModel = OpenAiModel(sys)

    source = sourceRepo.findSourceById(sourceId)
    if source is not None:
        processSource(
            sourceRepo,
            suggestionRepo,
            sys,
            fileHandler,
            suggestionModel,
            source,
        )

    session.commit()
"""
