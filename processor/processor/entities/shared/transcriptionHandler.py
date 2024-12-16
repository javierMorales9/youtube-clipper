from typing import Protocol

class TranscriptionHandler(Protocol):
    def callTranscribe(self): ...
