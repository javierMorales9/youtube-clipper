import os
import json
import subprocess

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

    def env(self, key: str) -> (str | None):
        try :
            return os.environ[key]
        except KeyError:
            return None

