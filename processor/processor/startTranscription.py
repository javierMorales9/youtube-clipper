import boto3
import os
from source.Source import Source

def startTranscription(source: Source):
    env = os.environ["ENV"]
    if env == "dev":
        basePath = os.environ["FILES_PATH"]
        path = f'{basePath}/{str(source.id)}'
        print("We don't generate a transcription in dev mode")
    else:
        bucket = os.environ["SOURCE_BUCKET"]
        aws_region = os.environ["AWS_REGION"]

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.client('transcribe')

        resource.start_transcription_job(
            TranscriptionJobName=f'{source.id}-transcribe',
            LanguageCode="es-ES",
            MediaFormat="mp4",
            Media={
                "MediaFileUri": f'https://{bucket}.s3-{aws_region}.amazonaws.com/{source.id}/original.mp4',
            },
            OutputBucketName=bucket,
            OutputKey=f'{source.id}/transcription.srt',
        )

