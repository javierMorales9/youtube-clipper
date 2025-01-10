from typing import Protocol

class VideoDownloader(Protocol):
    def downloadVideo(self, url: str): ...
