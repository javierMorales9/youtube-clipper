from typing import Protocol

from entities.shared.domain.system import System
from entities.source.domain.Word import Word

class TranscriptionHandler(Protocol):
    # We preserve callTranscribe for AmazonTranscriptionHandler
    #It might be interesting to implement the AmazonTranscription that
    #works by scheduling a job to offer a synchronous interface
    def callTranscribe(self, sourceId: str): ...
    def transcribe(self, sys: System) -> list[Word]: ...
