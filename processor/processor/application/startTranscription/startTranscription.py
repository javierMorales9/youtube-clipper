from entities.event.Event import Event, createTranscriptionFinishedEvent
from entities.event.eventRepository import EventRepository
from entities.source.sourceRepository import SourceRepository
from transcriptionHandler import TranscriptionHandler
from system import System


def startTranscription(
    eventRepo: EventRepository,
    sourceRepo: SourceRepository,
    sys: System,
    transcriptionHandler: TranscriptionHandler,
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

    createTranscriptionFinishedEvent(source)

    newEv = createTranscriptionFinishedEvent(source)
    eventRepo.saveEvent(newEv)

