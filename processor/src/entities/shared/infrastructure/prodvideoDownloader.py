from entities.shared.domain.system import System


class ProdVideoDownloader:
    def __init__(self, sys: System):
        self.sys = sys
        self.path = sys.path("original.mp4")

    def downloadVideo(self, url: str):
        print(f"Downloading video from {url} to {self.path}")

        stdout, stderr, returncode = self.sys.run(
            [
                "yt-dlp",
                "-S",
                "vcodec:h264,res,acodec:m4a",
                "-f",
                "bestvideo+bestaudio",
                url,
                "-o",
                self.path,
            ], silent=False
        )

        if returncode != 0 or not self.sys.fileExist("original.mp4"):
            error = stderr or stdout or "yt-dlp did not create original.mp4"
            raise RuntimeError(f"Error downloading video: {error}")

        print("Finished downloading video")
