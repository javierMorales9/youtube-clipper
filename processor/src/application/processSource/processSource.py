from application.processSource.createSuggestions import createSuggestions

from entities.source.domain.sourceRepository import SourceRepository
from entities.suggestion.domain.suggestionRepository import SuggestionRepository
from entities.shared.domain.fileHandler import FileHandler
from entities.shared.domain.aiModel import AIModel

from entities.shared.domain.system import System
from entities.shared.domain.videoDownloader import VideoDownloader


def processSource(
    sourceRepo: SourceRepository,
    suggestionRepo: SuggestionRepository,
    sys: System,
    fileHandler: FileHandler,
    aiModel: AIModel,
    videoDownloader: VideoDownloader,
    sourceId: str,
):
    source = sourceRepo.findSourceById(sourceId)
    if source is None:
        return

    print(f"Processing source {source.id}")

    if source.origin == "url" and source.url is not None:
        videoDownloader.downloadVideo(source.url)
    else:
        fileHandler.downloadFiles(keys=["original.mp4"])

    duration = getVideoDuration(sys)
    width, height = getVideoResolution(sys)

    words = aiModel.transcribe(duration)

    suggestions = createSuggestions(aiModel, source, words)
    suggestionRepo.saveSuggestions(suggestions)

    generateHls(sys)
    createTimeline(sys)
    createSnapshot(sys, duration)

    fileHandler.saveFiles()

    sourceRepo.saveTranscription(source.id, words)
    source.finishProcessing(duration, width, height)
    sourceRepo.saveSource(source)

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


def createTimeline(sys: System):
    print("Creating timeline")
    sys.run(
        [
            "ffmpeg",
            "-i",
            sys.path("original.mp4"),
            "-vf",
            f"select='not(mod(t\\,1))',scale=240:-1",
            "-vsync",
            "vfr",
            "-q:v",
            "2",
            sys.path("timeline_%d.jpg"),
            "-y",
        ], silent=False
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
