from application.processSource.createSuggestions import createSuggestions
from application.processSource.extractWordsFromFile import extractWordsFromFile

from entities.source.domain.sourceRepository import SourceRepository
from entities.suggestion.domain.suggestionRepository import SuggestionRepository
from entities.shared.domain.fileHandler import FileHandler
from entities.shared.domain.aiModel import AIModel

from entities.shared.domain.system import System
from entities.source.domain.Source import Source


def processSource(
    sourceRepo: SourceRepository,
    suggestionRepo: SuggestionRepository,
    sys: System,
    fileHandler: FileHandler,
    suggestionModel: AIModel,
    source: Source,
):
    print(f"Processing source after transcription {source.id}")
    fileHandler.downloadFiles(keys=["original.mp4", "transcription.json"])

    duration = getVideoDuration(sys)
    width, height = getVideoResolution(sys)
    words = extractWordsFromFile(sys)

    generateHls(sys)
    createTimeline(sys, duration)
    createSnapshot(sys, duration)
    suggestions = createSuggestions(suggestionModel, source, words)
    sourceRepo.saveTranscription(source.id, words)
    source.finishProcessing(duration, width, height)

    sourceRepo.saveSource(source)
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
    process = sys.run(
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
    stdout = process[0]
    duration = float(stdout)

    return duration


def getVideoResolution(sys: System):
    print("Getting video resolution")
    result = sys.run(
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

    # Resolution format is "1920x1080"
    resolution = result.split("x")

    if len(resolution) != 2:
        print("Invalid resolution")
        width = 0
        height = 0

    else:
        width = int(resolution[0])
        height = int(resolution[1])

    return width, height


def createTimeline(sys: System, duration: float):
    intDuration = int(duration)

    print("Creating timeline. Duration:", duration)
    sys.run(
        [
            "ffmpeg",
            "-i",
            sys.path("original.mp4"),
            '-frames',
            '1',
            "-vf",
            f"select=not(mod(n\\,30)),scale=240:-1,tile=1x{intDuration}",
            sys.path("timeline.png"),
            "-y",
        ],
    )

def createSnapshot(sys: System, duration: float):
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
