from entities.event.Event import Event, createTranscriptionFinishedEvent

from application.processSource.createSuggestions import createSuggestions
from application.processSource.extractWordsFromFile import extractWordsFromFile

from entities.event.eventRepository import EventRepository
from entities.source.sourceRepository import SourceRepository
from entities.suggestion.suggestionRepository import SuggestionRepository
from fileHandler import FileHandler

from system import System


def processSource(
    sourceRepo: SourceRepository,
    eventRepo: EventRepository,
    suggestionRepo: SuggestionRepository,
    sys: System,
    fileHandler: FileHandler,
    event: Event,
):
    fileHandler.downloadFiles()

    source = sourceRepo.findSourceById(event.sourceId)
    if source is None:
        return

    print(f"Processing source after transcription {source.id}")

    if not sys.fileExist("transcription.json"):
        newEv = createTranscriptionFinishedEvent(source)
        eventRepo.saveEvent(newEv)
        return

    generateHls(sys)

    duration = getVideoDuration(sys)
    resolution = getVideoResolution(sys)

    createTimelineAndSnapshot(sys, duration)

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

    sourceRepo.saveSource(source)

    words = extractWordsFromFile(sys)
    sourceRepo.saveTranscription(source.id, words)

    suggestions = createSuggestions(sys, source, words)
    suggestionRepo.saveSuggestions(suggestions)

    fileHandler.saveFiles()


def generateHls(sys: System):
    print("Generating HLS")
    sys.run(
        [
            "ffmpeg",
            "-i",
            sys.path("original.mp4"),
            "-f",
            "hls",
            "-codec",
            "copy",
            "-hls_time",
            "10",
            "-hls_list_size",
            "0",
            sys.path("adaptive.m3u8"),
            "-y",
        ]
    )


def getVideoDuration(sys: System):
    print("Getting video duration")
    aso = sys.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            sys.path("original.mp4"),
        ],
    )
    stdout = aso[0]
    duration = float(stdout)

    return duration


def getVideoResolution(sys: System):
    print("Getting video resolution")
    return sys.run(
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
            sys.path("original.mp4"),
        ],
    )[0]


def createTimelineAndSnapshot(sys: System, duration: float):
    intDuration = int(duration)

    print("Creating timeline. Duration:", duration)
    sys.run(
        [
            "ffmpeg",
            "-i",
            sys.path("original.mp4"),
            "-vf",
            f"select=not(mod(n\\,30)),scale=240:-1,tile=1x{intDuration}",
            sys.path("timeline.png"),
            "-y",
        ],
    )

    print("Creating snapshot")
    sys.run(
        [
            "ffmpeg",
            "-ss",
            str(duration / 2),
            "-i",
            sys.path("original.mp4"),
            "-frames:v",
            "1",
            "-q:v",
            "1",
            sys.path("snapshot.png"),
            "-y",
        ],
    )
