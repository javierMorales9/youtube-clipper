from entities.shared.domain.system import System


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
                url,
                "-o",
                self.path,
            ]
        )

        print("Finished downloading video")
