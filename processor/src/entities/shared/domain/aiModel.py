from typing import List, Protocol, TypeVar
from entities.source.domain.Word import Word

FormatT = TypeVar(
    "FormatT",
    # if it isn't given then we don't do any parsing
    #default=None,
)

class AIModel(Protocol):
    def generateEmbedding(self, text: str) -> List[float]: ...
    def generateEmbeddingsFromList(self, lines: List[str]) -> List[List[float]]: ...
    def jsonCall(self, roleText: str, userText: str, format: type[FormatT]) -> (FormatT | None): ...
    def transcribe(self) -> list[Word]: ...
