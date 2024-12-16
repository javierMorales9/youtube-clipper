from entities.event.Event import Event, createTranscriptionFinishedEvent
from entities.event.eventRepository import EventRepository
from entities.source.sourceRepository import SourceRepository
from entities.shared.transcriptionHandler import TranscriptionHandler
from entities.shared.system import System
from entities.shared.dateCreator import DateCreator


def startTranscription(
    eventRepo: EventRepository,
    sourceRepo: SourceRepository,
    sys: System,
    transcriptionHandler: TranscriptionHandler,
    dateCreator: DateCreator,
    event: Event,
):
    if sys.env("ENV") == "dev":
        print(
            f"We don't generate a transcription in dev mode. Paste the file here {sys.path('')}"
        )
        return

    source = sourceRepo.findSourceById(event.sourceId)
    if source is None:
        return

    print(f"New source {source.id}")

    transcriptionHandler.callTranscribe()

    newEv = createTranscriptionFinishedEvent(source, dateCreator.newDate())
    eventRepo.saveEvent(newEv)

