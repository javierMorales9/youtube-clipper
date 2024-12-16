from typing import Protocol

class FileHandler(Protocol):
    def downloadFiles(self): ...
    def saveFiles(self): ...

