from entities.event.Event import Event, createTranscriptionFinishedEvent
from entities.event.eventRepository import EventRepository
from entities.source.sourceRepository import SourceRepository
from entities.shared.transcriptionHandler import TranscriptionHandler
from entities.shared.system import System
from entities.shared.dateCreator import DateCreator
from entities.shared.videoDownloader import VideoDownloader


def startTranscription(
    eventRepo: EventRepository,
    sourceRepo: SourceRepository,
    sys: System,
    transcriptionHandler: TranscriptionHandler,
    videoDownloader: VideoDownloader,
    dateCreator: DateCreator,
    event: Event,
):
    source = sourceRepo.findSourceById(event.sourceId)
    if source is None:
        return

    print(f"New source {source.id}")

    if source.origin == "url" and source.url is not None:
        videoDownloader.downloadVideo(source.url)

    if sys.env("ENV") == "dev":
        print(
            f"We don't generate a transcription in dev mode. Paste the file here {sys.path('')}"
        )
        return

    else:
        transcriptionHandler.callTranscribe()

    newEv = createTranscriptionFinishedEvent(source, dateCreator.newDate())
    eventRepo.saveEvent(newEv)

