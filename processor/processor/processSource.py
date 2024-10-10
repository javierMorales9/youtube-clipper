# import boto3
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


def processSource(sourceId: str, basePath: str):
    path = f'{basePath}/{str(sourceId)}'
    duration = generateFiles(path)
    resolution = getResolution(path)

    print("Finish processing source", duration, resolution)

    return (duration, resolution)
