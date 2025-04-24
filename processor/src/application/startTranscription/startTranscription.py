from entities.event.domain.Event import Event, createTranscriptionInProgressEvent
from entities.event.domain.eventRepository import EventRepository
from entities.source.domain.sourceRepository import SourceRepository
from entities.shared.domain.transcriptionHandler import TranscriptionHandler
from entities.shared.domain.system import System
from entities.shared.domain.dateCreator import DateCreator
from entities.shared.domain.videoDownloader import VideoDownloader
from entities.shared.domain.fileHandler import FileHandler


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


    transcriptionHandler.callTranscribe(source.id)

    newEv = createTranscriptionInProgressEvent(source, dateCreator.newDate())
    eventRepo.saveEvent(newEv)

