import boto3
import os
from clip.Clip import Clip
import subprocess

from math import floor

from source.Source import Source

def generateFiles(clip: Clip, source: Source, path: str):
    if source.width is None or source.height is None:
        raise Exception('Source resolution is missing')

    arguments = [
        'ffmpeg',
        '-i', f'{path}/{clip.sourceId}/original.mp4',
        '-ss', str(clip.range.start), '-to', str(clip.range.end),
    ]

    ss = ''.join(f'[s{i}]' for i in range(len(clip.sections)))
    filters = f'[0:v]split={len(clip.sections)}{ss};'
    concat = ''
    for i in range(len(clip.sections)):
        section = clip.sections[i];
        fragLen = len(section.fragments)

        fs = ''.join(f'[f{i}{j}]' for j in range(len(section.fragments)))
        filters += f'[s{i}]split={fragLen}{fs};'
        for j in range(fragLen):
          fragment = section.fragments[j]
          cropWidth = floor(fragment.width / clip.width * source.width)
          cropHeight = floor(fragment.height / clip.height * source.height)
          cropX = floor(fragment.x / clip.width * source.width)
          cropY = floor(fragment.y / clip.height * source.height)
          filters += f'[f{i}{j}]crop={cropWidth}:{cropHeight}:{cropX}:{cropY}[e{i}{j}];'

          es = ''.join(f'[e{i}{j}]' for i in section.fragments)
          filters += f'{es}vstack=inputs={fragLen},' if fragLen > 1 else f'[e{i}0]'
          filters += f'scale=1080:1920[v{i}];';
          concat += f'[v{i}]';

    filters += f'{concat}concat=n={len(clip.sections)}[v]';

    arguments.extend([
        "-filter_complex", filters,
        "-map", "[v]",
        "-map", "0:a?",
        "-y",
        f"{path}/{clip.sourceId}/{clip.id}.mp4"
    ])

    result = subprocess.run(arguments, capture_output=True, text=True)
    result.stdout

    if result.returncode != 0:
        print('Error', result.stderr)
        raise Exception('Error generating clip', result.stderr)

def generateClip(clip: Clip, source: Source):
    env = os.environ["ENV"]

    if env == "dev":
        print('Generating clip', clip.id)
        path = os.environ["FILES_PATH"]
        generateFiles(clip, source, path)
    else:
        print('Generating clip', clip.id)
        bucket = os.environ["SOURCE_BUCKET"]
        aws_region = os.environ["AWS_REGION"]

        session = boto3.Session(
            region_name=aws_region,
        )
        resource = session.resource('s3')
        my_bucket = resource.Bucket(bucket)

        # Create tmp/{sourceId} folder
        os.mkdir(f'/tmp/{source.id}')

        print("Downloading file", f'{source.id}/original.mp4')
        my_bucket.download_file(f'{source.id}/original.mp4', f'/tmp/{source.id}/original.mp4')
        #my_bucket.download_file(f'{source.id}/transcription.txt', f'/tmp/{source.id}/transcription.txt')

        generateFiles(clip, source, f'/tmp')

        for file in os.listdir(f'/tmp/{source.id}'):
            if file == 'original.mp4' or file == 'transcription.txt':
                continue

            local_file = f'/tmp/{source.id}/{file}'
            my_bucket.upload_file(local_file, f'{source.id}/{file}')
            os.remove(local_file)

        os.rmdir(f'/tmp/{source.id}')
