import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from flask_server import flask_server

from entities.event.Event import EventType, createTranscriptionInProgressEvent

from entities.event.postgresEventRepository import PostgresEventRepository
from entities.source.postgresSourceRepository import PostgresSourceRepository
from entities.clip.postgresClipRepository import PostgresClipRepository
from entities.suggestion.postgresSuggestionRepository import (
    PostgresSuggestionRepository,
)

from entities.shared.s3TranscriptionHandler import S3TranscriptionHandler
from entities.shared.s3FileHandler import S3FileHandler
from entities.shared.openAiModel import OpenAiModel
from entities.shared.prodSystem import ProdSystem

from application.generateClip.generateClip import generateClip
from application.processSource.processSource import processSource
from application.startTranscription.startTranscription import startTranscription
from entities.shared.prodDateCreator import ProdDateCreator
from entities.shared.prodvideoDownloader import ProdVideoDownloader


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
                    transcriptionHandler = S3TranscriptionHandler(
                        sys, event.sourceId
                    )
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
                    suggestionModel = OpenAiModel(sys)

                    source = sourceRepo.findSourceById(event.sourceId)
                    if source is None:
                        return

                    if not fileHandler.checkIfFilesExist("transcription.json"):
                        print("Transcription not ready yet")
                        newEv = createTranscriptionInProgressEvent(source, dateCreator.newDate())
                        eventRepo.saveEvent(newEv)
                        return

                    processSource(
                        sourceRepo,
                        suggestionRepo,
                        sys,
                        fileHandler,
                        suggestionModel,
                        source,
                    )
                elif event.type == EventType.CLIP_UPDATED:
                    sys = ProdSystem(event.sourceId)
                    fileHandler = S3FileHandler(sys, event.sourceId)

                    generateClip(sourceRepo, clipRepo, sys, fileHandler, event)

            session.commit()

        sleep(10)


main()
