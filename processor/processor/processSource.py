import subprocess


def processSource(path: str):
    generateHls(path)

    duration = getVideoDuration(path)
    resolution = getVideoResolution(path)

    createTimelineAndSnapshot(path, duration)

    print("Finish processing source", duration, resolution)
    return (duration, resolution)


def generateHls(path: str):
    print("Generating HLS")
    subprocess.run(
        [
            "ffmpeg",
            "-i",
            f"{path}/original.mp4",
            "-f",
            "hls",
            "-codec",
            "copy",
            "-hls_time",
            "10",
            "-hls_list_size",
            "0",
            f"{path}/adaptive.m3u8",
            "-y",
        ],
        capture_output=True,
    )


def getVideoDuration(path: str):
    print("Getting video duration")
    aso = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            f"{path}/original.mp4",
        ],
        capture_output=True,
        text=True,
    )
    duration = float(aso.stdout)

    return duration


def getVideoResolution(path: str):
    print("Getting video resolution")
    process = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "csv=s=x:p=0",
            f"{path}/original.mp4",
        ],
        capture_output=True,
        text=True,
    )

    return process.stdout


def createTimelineAndSnapshot(path: str, duration: float):
    intDuration = int(duration)

    print("Creating timeline. Duration:", duration)
    subprocess.run(
        [
            "ffmpeg",
            "-i",
            f"{path}/original.mp4",
            "-vf",
            f"select=not(mod(n\\,30)),scale=240:-1,tile=1x{intDuration}",
            f"{path}/timeline.png",
            "-y",
        ],
        capture_output=True,
    )

    print("Creating snapshot")
    subprocess.run(
        [
            "ffmpeg",
            "-ss",
            str(duration / 2),
            "-i",
            f"{path}/original.mp4",
            "-frames:v",
            "1",
            "-q:v",
            "1",
            f"{path}/snapshot.png",
            "-y",
        ],
        capture_output=True,
    )
