import boto3
import os

from entities.event.Event import Event, createTranscriptionFinishedEvent
from entities.event.eventRepository import EventRepository
from entities.source.sourceRepository import SourceRepository
from entities.source.Source import Source


def startTranscription(
    eventRepo: EventRepository, sourceRepo: SourceRepository, event: Event
):
    env = os.environ["ENV"]
    if env == "dev":
        basePath = os.environ["FILES_PATH"]
        path = f"{basePath}/{str(event.sourceId)}"
        print(
            f"We don't generate a transcription in dev mode. Paste the file here {path}"
        )
        return

    source = sourceRepo.findSourceById(event.sourceId)
    if source is None:
        return

    print(f"New source {source.id}")

    callTranscribe(source)

    createTranscriptionFinishedEvent(source)

    newEv = createTranscriptionFinishedEvent(source)
    eventRepo.saveEvent(newEv)


def callTranscribe(source: Source):
    bucket = os.environ["SOURCE_BUCKET"]
    aws_region = os.environ["AWS_REGION"]

    session = boto3.Session(
        region_name=aws_region,
    )
    resource = session.client("transcribe")

    try:
        resource.start_transcription_job(
            TranscriptionJobName=f"{source.id}-transcribe",
            LanguageCode="es-ES",
            MediaFormat="mp4",
            Media={
                "MediaFileUri": f"https://{bucket}.s3-{aws_region}.amazonaws.com/{source.id}/original.mp4",
            },
            OutputBucketName=bucket,
            OutputKey=f"{source.id}/transcription.json",
        )
    except Exception as e:
        print("Error starting transcription job", e)
