import boto3

from entities.shared.system import System

class S3TranscriptionHandler:
    def __init__(self, sys: System, sourceId: str):
        self.sys = sys
        self.sourceId = sourceId

    def callTranscribe(self):
        bucket = self.sys.env("SOURCE_BUCKET")
        aws_region = self.sys.env("AWS_REGION")

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.client("transcribe")

        try:
            resource.start_transcription_job(
                TranscriptionJobName=f"{self.sourceId}-transcribe",
                LanguageCode="es-ES",
                MediaFormat="mp4",
                Media={
                    "MediaFileUri": f"https://{bucket}.s3-{aws_region}.amazonaws.com/{self.sourceId}/original.mp4",
                },
                OutputBucketName=bucket,
                OutputKey=f"{self.sourceId}/transcription.json",
            )
        except Exception as e:
            print("Error starting transcription job", e)

