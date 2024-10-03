# import boto3
import subprocess
import ffmpeg


def generateFiles(path: str):
    print("Execute ffmpeg", path)

    subprocess.run(
        f"""ffmpeg -i {path}/original.mp4 \
     -codec: copy \
     -hls_time 10 \
     -hls_list_size 0 \
     -f hls \
    {path}/adaptive.m3u8"""
    )

    ad = subprocess.run(
        f"""ffprobe \
      -v error \
      -show_entries format=duration \
      -of default=noprint_wrappers=1:nokey=1 \
     {path}/original.mp4""",
        text=True,
    )
    duration = float(ad.stdout)
    intDuration = int(duration)

    print("Creating timeline. Duration: ", duration)
    subprocess.run(
        f"""ffmpeg -i {path}/original.mp4 \
      -frames 1 \
      -vf "select=not(mod(n\\,30)),scale=240:-1,tile=1x{intDuration}" \
     {path}/timeline.png -y"""
    )

    print("Creating snapshot")
    subprocess.run(
        f"""ffmpeg \
      -ss {duration / 2} \
      -i {path}/original.mp4 \
      -frames:v 1 \
      -q:v 1 \
     {path}/snapshot.png -y"""
    )

    return duration


def getResolution(path: str):
    process = subprocess.run(
        f"""ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 {path}/original.mp4""",
        text=True,
    )
    return process.stdout


def processSource(sourceId: str):

    basePath = "../public/files/"
    path = basePath + str(sourceId)
    duration = generateFiles(path)
    print("\n\n Parece que el rollo esta aqui \n\n", path)
    resolution = getResolution(path)

    print("Finish processing source", duration, resolution)

    return (duration, resolution)
