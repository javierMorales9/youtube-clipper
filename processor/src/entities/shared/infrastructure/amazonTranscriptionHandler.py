import boto3

from entities.shared.domain.system import System

class AmazonTranscriptionHandler:
    def __init__(self, sys: System):
        self.sys = sys

    def callTranscribe(self, sourceId: str):
        bucket = self.sys.env("SOURCE_BUCKET")
        aws_region = self.sys.env("AWS_REGION")

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.client("transcribe")

        try:
            resource.start_transcription_job(
                TranscriptionJobName=f"{sourceId}-transcribe",
                LanguageCode="es-ES",
                MediaFormat="mp4",
                Media={
                    "MediaFileUri": f"https://{bucket}.s3-{aws_region}.amazonaws.com/{sourceId}/original.mp4",
                },
                OutputBucketName=bucket,
                OutputKey=f"{sourceId}/transcription.json",
            )
        except Exception as e:
            print("Error starting transcription job", e)

    def transcribe(self, sys: System):
        return []

