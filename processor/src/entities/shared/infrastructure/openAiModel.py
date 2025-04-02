import math
from typing import List, TypeVar
from openai import OpenAI
import tiktoken

from entities.shared.domain.system import System
from entities.source.domain.Word import Word

import pandas as pd

from entities.shared.domain.system import System


class OpenAiModel:
    def __init__(self, sys: System):
        self.sys = sys

    def generateEmbedding(self, text: str):
        client = OpenAI(
            api_key=self.sys.env("OPENAI_API_KEY"),
        )

        result = client.embeddings.create(
            input=text,
            model="text-embedding-3-small",
            encoding_format="float",
        )

        return result.data[0].embedding

    def generateEmbeddingsFromList(self, lines: List[str]):
        if bool(self.sys.env("CACHE_FROM_FS")):
            return self.fromFs()

        fullTranscript = "".join(lines)
        encoding = tiktoken.get_encoding("cl100k_base")
        numTokens = len(encoding.encode(fullTranscript))

        maxTokens = 2048

        numBatches = math.ceil(numTokens / (maxTokens / 2))
        batchSize = len(lines) // numBatches

        batches = []
        for i in range(numBatches):
            start = i * batchSize

            end = (i + 1) * batchSize
            if i == numBatches - 1:
                end = len(lines)

            batch = lines[start:end]
            batches.append(batch)

        client = OpenAI(
            api_key=self.sys.env("OPENAI_API_KEY"),
        )

        embeddings: List[List[float]] = []
        for batch in batches:
            result = client.embeddings.create(
                input=batch,
                model="text-embedding-3-small",
                encoding_format="float",
            )
            embeddings.extend([embedding.embedding for embedding in result.data])

        return embeddings

    FormatT = TypeVar(
        "FormatT",
        # if it isn't given then we don't do any parsing
        # default=None,
    )

    def jsonCall(
        self, roleText: str, userText: str, format: type[FormatT]
    ) -> FormatT | None:
        client = OpenAI(
            api_key=self.sys.env("OPENAI_API_KEY"),
        )

        result = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": roleText,
                },
                {
                    "role": "user",
                    "content": userText,
                },
            ],
            response_format=format,
        )

        return result.choices[0].message.parsed

    def fromFs(self) -> List[List[float]]:
        return pd.read_json(f"../public/test/phrases.json")["embedding"].to_list()

    def transcribe(self, duration: float) -> list[Word]:
        print("Extracting audio from video")
        self.sys.run(
            [
                "ffmpeg",
                "-i",
                self.sys.path("original.mp4"),
                "-ar",
                "44100",
                "-ac",
                "2",
                "-b:a",
                "192k",
                "-write_xing",
                "0",
                self.sys.path("audio.mp3"),
                "-y",
            ]
        )

        # We need to split the audio into chunks of 10 minutes
        # to avoid the api 25MB limit
        print("Splitting audio into chunks")
        batch_size = 10 * 60  # 10 minutes
        batch_count = int(duration // batch_size) + 1
        self.sys.run(
            [
                "ffmpeg",
                "-i",
                self.sys.path("audio.mp3"),
                "-f",
                "segment",
                "-segment_time",
                str(batch_size),
                "-ar",
                "44100",
                "-ac",
                "2",
                "-b:a",
                "192k",
                self.sys.path("audio_%d.mp3"),
                "-y",
            ]
        )

        client = OpenAI(
            api_key=self.sys.env("OPENAI_API_KEY"),
        )

        words: list[Word] = []
        print(batch_count)
        for i in range(batch_count):
            print(f"Transcribing chunk {i}")
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=open(self.sys.path(f"audio_{i}.mp3"), "rb"),
                response_format="verbose_json",
                timestamp_granularities=["word"],
            )

            if transcription.words is None:
                continue

            for word in transcription.words:
                words.append(
                    {
                        "word": word.word,
                        "start": int((word.start + batch_size * i) * 1000),
                        "end": int((word.end + batch_size * i) * 1000),
                    }
                )

        return words
