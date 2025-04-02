import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from flask_server import flask_server

from entities.event.domain.Event import EventType

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

from entities.shared.infrastructure.s3FileHandler import S3FileHandler
from entities.shared.infrastructure.openAiModel import OpenAiModel
from entities.shared.infrastructure.prodSystem import ProdSystem

from application.generateClip.generateClip import generateClip
from application.processSource.processSource import processSource
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
            event = eventRepo.getNextEvent()

            if event is not None:
                sourceRepo = PostgresSourceRepository(session)
                suggestionRepo = PostgresSuggestionRepository(session)
                clipRepo = PostgresClipRepository(session)

                sys = ProdSystem(event.sourceId, shouldRemoveDir=env != "dev")
                fileHandler = S3FileHandler(sys, event.sourceId)
                videoDownloader = ProdVideoDownloader(sys)
                aiModel = OpenAiModel(sys)

                if event.type == EventType.SOURCE_UPLOADED:
                    processSource(
                        sourceRepo,
                        suggestionRepo,
                        sys,
                        fileHandler,
                        aiModel,
                        videoDownloader,
                        event.sourceId,
                    )
                elif event.type == EventType.CLIP_UPDATED:
                    generateClip(sourceRepo, clipRepo, sys, fileHandler, event)

                sys.clean()

            session.commit()

        sleep(10)


main()
