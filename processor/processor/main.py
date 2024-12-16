import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from flask_server import flask_server
from fileHandler import S3FileHandler
from system import ProdSystem

from entities.event.Event import EventType

from entities.event.postgresEventRepository import PostgresEventRepository
from entities.source.postgresSourceRepository import PostgresSourceRepository
from entities.clip.postgresClipRepository import PostgresClipRepository
from entities.suggestion.postgresSuggestionRepository import (
    PostgresSuggestionRepository,
)

from application.generateClip.generateClip import generateClip
from application.processSource.processSource import processSource
from application.startTranscription.startTranscription import startTranscription
from transcriptionHandler import S3TranscriptionHandler


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
            print("Fetching event to process")
            eventRepo = PostgresEventRepository(session)
            sourceRepo = PostgresSourceRepository(session)
            suggestionRepo = PostgresSuggestionRepository(session)
            clipRepo = PostgresClipRepository(session)

            event = eventRepo.getNextEvent()

            if event is not None:
                if event.type == EventType.SOURCE_UPLOADED:
                    prodSystem = ProdSystem(event.sourceId)
                    transcriptionHandler = S3TranscriptionHandler(
                        prodSystem, event.sourceId
                    )

                    startTranscription(
                        eventRepo, sourceRepo, prodSystem, transcriptionHandler, event
                    )
                elif event.type == EventType.TRANSCRIPTION_FINISHED:
                    prodSystem = ProdSystem(event.sourceId)
                    fileHandler = S3FileHandler(prodSystem, event.sourceId)

                    processSource(
                        sourceRepo,
                        eventRepo,
                        suggestionRepo,
                        prodSystem,
                        fileHandler,
                        event,
                    )
                elif event.type == EventType.CLIP_UPDATED:
                    prodSystem = ProdSystem(event.sourceId)
                    fileHandler = S3FileHandler(prodSystem, event.sourceId)

                    generateClip(sourceRepo, clipRepo, prodSystem, fileHandler, event)
            else:
                print("No events to process")
            session.commit()

        sleep(10)


main()
