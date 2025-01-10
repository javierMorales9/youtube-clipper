from typing import Protocol
from typing import Protocol
from entities.clip.Clip import Clip

class ClipRepository(Protocol):
    def findClipById(self, clipId: str) -> (Clip | None): ...
    def finishClipProcessing(self, clipId: str): ...
