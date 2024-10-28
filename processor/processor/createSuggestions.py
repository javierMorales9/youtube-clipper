import os
import json
from source.Source import Source
import math
from typing import List
from openai import OpenAI
from openai.types.embedding import Embedding
import tiktoken
import numpy as np
import pandas as pd


def createSuggestions(source: Source):
    env = os.environ["ENV"]

    if env == "dev":
        path = os.environ["FILES_PATH"]

        interventions = extractInterventionsFromSrt("../public")

        df = pd.DataFrame(interventions)

        """
        queryEmb = generateQueryEmedding(source)
        getEmbeddingsForInterventions(df)

        with open("../public/queryEmb.json", "w") as f:
            json.dump(queryEmb, f)

        with open("../public/embeddings.json", "w") as f:
            json.dump(embeddings, f)
        """

        queryF = open(f"{path}/../test/queryEmb.json", "r")
        queryEmb = json.load(queryF)

        srtF = open(f"{path}/../test/embeddings.json", "r")
        embeddings = json.load(srtF)
        df["intervention_embedding"] = embeddings

        df["similarities"] = df["intervention_embedding"].apply(
            lambda x: cosineSimilarity(x, queryEmb)
        )

        bestClips = df.sort_values(by="similarities", ascending=False).head(20)
        """
         Las mejores putas. 

         Cojo una de las 20.
         Sus y ambas < sus -> descartamos este, y a partir de aqui solo tiramos arriba

         Sus y la anterior < sus -> descartamos este, y a partir de aqui solo tiramos pabajo
         Sus y posterior
        """
        #bestClips
        print(bestClips)
    else:
        path = f"/tmp/{source.id}"
        df = pd.DataFrame()

        extractInterventionsFromSrt(path)

        queryEmb = generateQueryEmedding(source)
        getEmbeddingsForInterventions(df)


def cosineSimilarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def extractInterventionsFromSrt(path: str):
    f = open(f"{path}/srtSubtitles.srt", "r")
    lines = f.readlines()

    interventions = []
    for i in range(4, len(lines), 4):
        id = lines[i - 4].strip()

        fromStr = lines[i - 3].split(" --> ")[0]
        fromTime = toMillis(fromStr)

        toStr = lines[i - 3].split(" --> ")[1]
        toTime = toMillis(toStr)

        text = lines[i - 2].strip()

        interventions.append(
            {
                "index": id,
                "from": fromTime,
                "to": toTime,
                "text": text,
            }
        )

    return interventions


def toMillis(timeStr):
    fromStr, millis = timeStr.split(",")
    hours, minutes, seconds = fromStr.split(":")
    return (
        int(hours) * 3600 * 1000
        + int(minutes) * 60 * 1000
        + int(seconds) * 1000
        + int(millis)
    )


def generateQueryEmedding(source: Source):
    name = source.name
    genre = source.genre
    tags = source.tags
    clipLength = source.clipLength

    queryText = f"""
    Imagine you are an editor for a famous podcast.
    You have been given the task of selecting the best clips from a new video called "{name}".
    The video is of the {genre} genre and has the following tags: {tags}.
    The clips should be {clipLength} long.
    """
    query = " ".join(map(lambda x: x.strip(), queryText.split("\n")))

    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )
    result = client.embeddings.create(
        input=query,
        model="text-embedding-3-small",
        encoding_format="float",
    )

    return result.data[0].embedding


def getEmbeddingsForInterventions(df: pd.DataFrame):
    fullTranscript = "".join(df["text"].to_list())
    encoding = tiktoken.get_encoding("cl100k_base")
    numTokens = len(encoding.encode(fullTranscript))

    maxTokens = 2048

    lines = len(df)
    numBatches = math.ceil(numTokens / (maxTokens / 2))
    batchSize = lines // numBatches

    batches = []
    for i in range(numBatches):
        start = i * batchSize
        end = (i + 1) * batchSize
        if i == numBatches - 1:
            end = lines
        batch = df["text"][start:end]
        batches.append(batch)

    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )

    embeddings: List[Embedding] = []
    for batch in batches:
        result = client.embeddings.create(
            input=batch,
            model="text-embedding-3-small",
            encoding_format="float",
        )
        embeddings.extend(result.data)

    df["intervention_embedding"] = [embedding.embedding for embedding in embeddings]
