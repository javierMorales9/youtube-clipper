import math
import os
from typing import List
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from time import sleep

from openai import OpenAI
from openai.types.embedding import Embedding
import tiktoken

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
                            duration, resolution = processSource(event.sourceId)

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
                            generateClip(clip, source)
                            finishClipProcessing(session, event.clipId)

            session.commit()

        # Sleep for 10 seconds before polling again
        sleep(10)


# loop()


def toMillis(timeStr):
    fromStr, millis = timeStr.split(",")
    hours, minutes, seconds = fromStr.split(":")
    return (
        int(hours) * 3600 * 1000
        + int(minutes) * 60 * 1000
        + int(seconds) * 1000
        + int(millis)
    )


def generateEmbeddingsFromSrt():
    f = open("../public/srtSubtitles.srt", "r")
    lines = f.readlines()
    metadata = []
    interventions = []

    for i in range(4, len(lines), 4):
        id = lines[i - 4].strip()

        fromStr = lines[i - 3].split(" --> ")[0]
        fromTime = toMillis(fromStr)

        toStr = lines[i - 3].split(" --> ")[1]
        toTime = toMillis(toStr)

        text = lines[i - 2].strip()

        metadata.append({"id:": id, "from": fromTime, "to": toTime})
        interventions.append(text)

    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )


    fullTranscript = "".join(interventions)
    encoding = tiktoken.get_encoding("cl100k_base")
    numTokens = len(encoding.encode(fullTranscript))

    maxTokens = 2048

    lines = len(interventions)
    numBatches = math.ceil(numTokens / (maxTokens/2))
    batchSize = lines // numBatches

    batches = []
    for i in range(numBatches):
        start = i * batchSize
        end = (i + 1) * batchSize
        if i == numBatches - 1:
            end = lines
        batch = interventions[start:end]
        batches.append(batch)

    embeddings: List[Embedding] = []
    for batch in batches:
        result = (
            client.embeddings.create(
                input=batch,
                model="text-embedding-3-small",
                encoding_format="float",
            )
        )
        embeddings.extend(result.data)


    # write the embeddings to a file
    with open("../public/embeddings.json", "w") as f:
        jsonArray = ',\n'.join([embedding.json() for embedding in embeddings])
        f.write(f"[{jsonArray}]")
