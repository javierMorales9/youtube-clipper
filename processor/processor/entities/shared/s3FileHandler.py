import os

import boto3

from entities.shared.system import System

class S3FileHandler:
    def __init__(self, sys: System, sourceId: str):
        self.filesToDownload = ["original.mp4", "transcription.json"]
        self.sys = sys
        self.sourceId = sourceId
        self.path = sys.path("")

    def downloadFiles(self):
        if self.sys.env("ENV") != "prod":
            return

        my_bucket = self.getBucket()

        # Create tmp/{sourceId} folder
        if not os.path.exists(self.path):
            os.makedirs(self.path)

        for file in self.filesToDownload:
            key = f"{self.sourceId}/{file}"
            local_filename = f"{self.path}/{file}"

            try:
                my_bucket.download_file(key, local_filename)
            except Exception as e:
                print("Error downloading file", key, e)

    def saveFiles(self):
        if self.sys.env("ENV") != "prod":
            return

        my_bucket = self.getBucket()

        # Upload files int tmp/{sourceId} to S3
        for file in os.listdir(self.path):
            if file in self.filesToDownload:
                continue

            local_file = f"{self.path}/{file}"
            my_bucket.upload_file(local_file, f"{self.sourceId}/{file}")
            os.remove(local_file)

        self.removeDirectory(self.path)

    def getBucket(self):
        bucket = os.environ["SOURCE_BUCKET"]
        aws_region = os.environ["AWS_REGION"]

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.resource("s3")
        return resource.Bucket(bucket)

    def removeDirectory(self, path: str):
        for root, dirs, files in os.walk(path, topdown=False):
            for name in files:
                os.remove(os.path.join(root, name))
            for name in dirs:
                os.rmdir(os.path.join(root, name))

        os.rmdir(path)
