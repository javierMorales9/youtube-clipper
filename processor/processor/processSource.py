import boto3
import os
import subprocess

def generateFiles(path: str):
    subprocess.run([
        "ffmpeg",
        "-i", f"{path}/original.mp4",
        "-f", "hls",
        "-codec", "copy",
        "-hls_time", "10",
        "-hls_list_size", "0",
        f"{path}/adaptive.m3u8",
        "-y"
    ])

    aso = subprocess.run([
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        f"{path}/original.mp4"
    ], capture_output=True, text=True)
    duration = float(aso.stdout)
    intDuration = int(duration)

    print("Creating timeline. Duration:", duration)
    subprocess.run([
        "ffmpeg",
        "-i", f"{path}/original.mp4",
        "-vf", f"select=not(mod(n\\,30)),scale=240:-1,tile=1x{intDuration}",
        f"{path}/timeline.png",
        "-y"
    ])

    print("Creating snapshot")
    subprocess.run([
        "ffmpeg",
        "-ss", str(duration / 2),
        "-i", f"{path}/original.mp4",
        "-frames:v", "1",
        "-q:v", "1",
        f"{path}/snapshot.png",
        "-y"
    ])

    return duration


def getResolution(path: str):
    process = subprocess.run([
        'ffprobe',
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'csv=s=x:p=0',
        f'{path}/original.mp4'
    ], capture_output=True, text=True)

    return process.stdout


def processSource(sourceId: str):
    env = os.environ["ENV"]
    if env == "dev":
        basePath = os.environ["FILES_PATH"]
        path = f'{basePath}/{str(sourceId)}'
        duration = generateFiles(path)
        resolution = getResolution(path)

        print("Finish processing source", duration, resolution)

        return (duration, resolution)
    else:
        bucket = os.environ["SOURCE_BUCKET"]
        aws_region = os.environ["AWS_REGION"]

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.resource('s3')
        my_bucket = resource.Bucket(bucket)

        # Create tmp/{sourceId} folder
        os.mkdir(f'/tmp/{sourceId}')

        key = f'{sourceId}/original.mp4'
        local_filename = f'/tmp/{sourceId}/original.mp4'
        print("Downloading file", key)
        my_bucket.download_file(key, local_filename)

        duration = generateFiles(f'/tmp/{sourceId}')
        resolution = getResolution(f'/tmp/{sourceId}')
        print("Finish processing source", duration, resolution)

        # Upload files int tmp/{sourceId} to S3
        for file in os.listdir(f'/tmp/{sourceId}'):
            if file == 'original.mp4':
                continue

            local_file = f'/tmp/{sourceId}/{file}'
            my_bucket.upload_file(local_file, f'{sourceId}/{file}')
            os.remove(local_file)

        os.rmdir(f'/tmp/{sourceId}')

        return (duration, resolution)
