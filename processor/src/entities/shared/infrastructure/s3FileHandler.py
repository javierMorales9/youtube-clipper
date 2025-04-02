import os
from typing import Optional

import boto3

from entities.shared.domain.system import System

class S3FileHandler:
    def __init__(self, sys: System, sourceId: str, uploadBaseFiles=False):
        self.baseFiles = ["original.mp4"]
        self.uploadBaseFiles = uploadBaseFiles
        self.sys = sys
        self.sourceId = sourceId
        self.path = sys.path("")

    def downloadFiles(self, keys: Optional[list[str]]):
        if(keys is not None):
            self.baseFiles = keys

        my_bucket = self.getBucket()

        for file in self.baseFiles:
            key = f"{self.sourceId}/{file}"
            local_filename = f"{self.path}/{file}"

            try:
                my_bucket.download_file(key, local_filename)
            except Exception as e:
                print("Error downloading file", key, e)

    def saveFiles(self):
        my_bucket = self.getBucket()

        # Upload files int tmp/{sourceId} to S3
        for file in os.listdir(self.path):
            print(f"File: {file}")
            if file in self.baseFiles and not self.uploadBaseFiles:
                continue

            if file.startswith("audio"):
                continue

            local_file = f"{self.path}/{file}"
            my_bucket.upload_file(local_file, f"{self.sourceId}/{file}")

    def checkIfFilesExist(self, file: str) -> bool:
        bucket = os.environ["SOURCE_BUCKET"]
        aws_region = os.environ["AWS_REGION"]

        key = f"{self.sourceId}/{file}"

        session = boto3.Session(
            region_name=aws_region,
        )
        s3 = session.client("s3")
        result = s3.head_object(
            Bucket=bucket,
            Key=key,
        )

        if result is not None:
            return True
        else:
            return False

    def getBucket(self):
        bucket = os.environ["SOURCE_BUCKET"]
        aws_region = os.environ["AWS_REGION"]

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.resource("s3")
        return resource.Bucket(bucket)
