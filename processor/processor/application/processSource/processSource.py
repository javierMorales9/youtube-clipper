import os
from pathlib import Path
import subprocess

from sqlalchemy.orm import Session
from entities.event.Event import Event, createTranscriptionFinishedEvent
from entities.event.eventRepository import saveEvent
from application.processSource.createSuggestions import createSuggestions
from application.processSource.extractWordsFromFile import extractWordsFromFile

from entities.source.sourceRepository import findSourceById, saveSource, saveTranscription
from entities.suggestion.suggestionRepository import saveSuggestions


def processSource(session: Session, event: Event):
    source = findSourceById(session, event.sourceId)
    if source is None:
        return

    print(f"Processing source after transcription {source.id}")

    path = f"{os.environ["FILES_PATH"]}/{str(source.id)}"

    if not Path(f"{path}/transcription.json").exists():
        newEv = createTranscriptionFinishedEvent(source)
        saveEvent(session, newEv)
        return

    generateHls(path)

    duration = getVideoDuration(path)
    resolution = getVideoResolution(path)

    createTimelineAndSnapshot(path, duration)

    print("Finish processing source", duration, resolution)

    source.processing = False
    source.duration = duration

    # Resolution format is "1920x1080"
    resolution = resolution.split("x")
    if len(resolution) != 2:
        print("Invalid resolution")
    else:
        source.width = int(resolution[0])
        source.height = int(resolution[1])

    saveSource(session, source)

    words = extractWordsFromFile(path)
    saveTranscription(session, source.id, words)

    suggestions = createSuggestions(source, words)
    saveSuggestions(session, suggestions)


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
