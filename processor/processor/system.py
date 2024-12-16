import os
import json
import subprocess
from typing import Any, Protocol


class System(Protocol):
    def fileExist(self, path: str) -> bool: ...
    def path(self, path: str) -> str: ...
    def run(self, command: list[str]) -> tuple[str, str, int]: ...
    def readFile(self, path: str) -> Any: ...
    def rm(self, path: str): ...
    def rename(self, old: str, new: str): ...
    def env(self, key: str) -> str: ...


class ProdSystem:
    def __init__(self, sourceId: str):
        self.sourceId = sourceId
        self.sourcePath = f"{os.environ["FILES_PATH"]}/{str(sourceId)}"

    def fileExist(self, path: str) -> bool:
        return os.path.exists(self.path(path))

    def path(self, path: str):
        return f"{self.sourcePath}/{path}"

    def run(self, command: list[str], silent: bool = True):
        result = subprocess.run(command, capture_output=silent, text=True)
        return (result.stdout, result.stderr, result.returncode)

    def readFile(self, path: str):
        f = open(self.path(path), "r")
        return json.load(f)

    def rm(self, path: str):
        os.unlink(self.path(path))

    def rename(self, old: str, new: str):
        os.rename(self.path(old), self.path(new))

    def env(self, key: str) -> str:
        return os.environ[key]
