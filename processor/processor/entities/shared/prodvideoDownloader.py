from entities.shared.system import System

class ProdVideoDownloader:
    def __init__(self, sys: System):
        self.sys = sys
        self.path = sys.path("original.mp4")

    def downloadVideo(self, url: str):
        print(f"Downloading video from {url} to {self.path}")

        self.sys.run(
            [
                "yt-dlp",
                "-S",
                "vcodec:h264,res,acodec:m4a",
                "-f",
                "bestvideo+bestaudio",
                "https://www.youtube.com/watch?v=Ghq7bMArUOA",
                "-o",
                self.sys.path("original.mp4"),
            ]
        )
