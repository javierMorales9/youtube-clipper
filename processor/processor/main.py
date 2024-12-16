import os
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from flask_server import flask_server
from entities.event.Event import EventType
from entities.event.eventRepository import getNextEvent
from s3FileHandlers import downloadFromS3, saveToS3

from application.generateClip.generateClip import generateClip
from application.processSource.processSource import processSource
from application.startTranscription.startTranscription import startTranscription


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
            event = getNextEvent(session)

            if event is not None:
                path = f"{os.environ["FILES_PATH"]}/{str(event.sourceId)}"

                if event.type == EventType.SOURCE_UPLOADED:
                    startTranscription(session, event)
                elif event.type == EventType.TRANSCRIPTION_FINISHED:
                    if env == "prod":
                        downloadFromS3(event.sourceId, path)

                    processSource(session, event)

                    if env == "prod":
                        saveToS3(event.sourceId, path)
                elif event.type == EventType.CLIP_UPDATED:
                    if env == "prod":
                        downloadFromS3(event.sourceId, path)

                    generateClip(session, event)

                    if env == "prod":
                        saveToS3(event.sourceId, path)
            else:
                print("No events to process")
            session.commit()

        sleep(10)


main()
