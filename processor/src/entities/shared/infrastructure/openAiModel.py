import math
from typing import List, TypeVar
from openai import OpenAI
import tiktoken

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
