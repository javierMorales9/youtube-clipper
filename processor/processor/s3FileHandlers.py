import os

import boto3

filesToDownload = ["original.mp4", "transcription.json"]

def downloadFromS3(sourceId: str, path: str):
    my_bucket = getBucket()

    # Create tmp/{sourceId} folder
    os.mkdir(path)

    for file in filesToDownload:
        key = f"{sourceId}/{file}"
        local_filename = f"{path}/{file}"

        print("Downloading file", key)
        my_bucket.download_file(key, local_filename)


def saveToS3(sourceId: str, path: str):
    my_bucket = getBucket()

    # Upload files int tmp/{sourceId} to S3
    for file in os.listdir(path):
        if file in filesToDownload:
            continue

        local_file = f"{path}/{file}"
        my_bucket.upload_file(local_file, f"{sourceId}/{file}")
        os.remove(local_file)

    os.rmdir(path)

def getBucket():
    bucket = os.environ["SOURCE_BUCKET"]
    aws_region = os.environ["AWS_REGION"]

    session = boto3.Session(
        region_name=aws_region,
    )
    resource = session.resource("s3")
    return resource.Bucket(bucket)
