from entities.event.Event import Event, createTranscriptionInProgressEvent
from entities.event.eventRepository import EventRepository
from entities.source.sourceRepository import SourceRepository
from entities.shared.transcriptionHandler import TranscriptionHandler
from entities.shared.system import System
from entities.shared.dateCreator import DateCreator
from entities.shared.videoDownloader import VideoDownloader
from entities.shared.fileHandler import FileHandler


def startTranscription(
    eventRepo: EventRepository,
    sourceRepo: SourceRepository,
    sys: System,
    fileHandler: FileHandler,
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
        fileHandler.saveFiles()


    transcriptionHandler.callTranscribe()

    newEv = createTranscriptionInProgressEvent(source, dateCreator.newDate())
    eventRepo.saveEvent(newEv)

