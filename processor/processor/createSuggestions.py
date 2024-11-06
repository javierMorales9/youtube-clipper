import os
from extractInterventions import extractInterventions
from source.Source import Source
import math
from typing import List
from openai import OpenAI
from openai.types.embedding import Embedding
import tiktoken
import numpy as np
import pandas as pd

clipDurationRanges = {
    "<30s": [0, 30000],
    "30s-1m": [30000, 60000],
    "1m-1.5m": [60000, 90000],
    "1.5m-3m": [90000, 180000],
    "3m-5m": [180000, 300000],
    "5m-10m": [300000, 600000],
    "10m-15m": [600000, 900000],
}


def createSuggestions(source: Source):
    env = os.environ["ENV"]

    if env == "dev":
        path = os.environ["FILES_PATH"]

        lines = extractInterventions("../public")

        #
        # The lines are created to show them in the a mobile view, so they are short
        # and don't have enough information for the beam search to work properly.
        # We will join the lines in pairs to create longer phrases.
        #
        i = 0
        step = 2
        phrasesArr = []
        index = 0
        while i < len(lines):
            phrasesArr.append(
                {
                    "index": index,
                    "start": i,
                    "length": step,
                    "text": " ".join([line["text"] for line in lines[i : i + step]]),
                }
            )
            i += step
            index += 1

        phrases = pd.DataFrame(phrasesArr)
 
        addEmbeddingsToDf(phrases)        

        queryEmb = generateQueryEmedding(source)

        phrases["similarities"] = phrases["embedding"].apply(
            lambda x: cosineSimilarity(x, queryEmb)
        )
        topPhrases = phrases.sort_values(by="similarities", ascending=False).head(20)

        suggestions = pd.DataFrame(
            columns=np.array(["start", "length", "text", "similarities"])
        )

        clipLengthRange = clipDurationRanges[source.clipLength or "<30s"]

        for i in range(0, len(topPhrases)):
            start = topPhrases.iloc[i]["index"]
            length = 1

            current = topPhrases.iloc[i]["text"]
            currentSim = topPhrases.iloc[i]["similarities"]
            currentDuration = 0

            withPrev = withNext = withBoth = ""
            withPrevSim = withNextSim = withBothSim = 0
            withPrevDuration = withNextDuration = withBothDuration = 0

            takePrev = takeNext = True

            while takePrev or takeNext:
                if takePrev:
                    withPrev = phrases.loc[start - 1]["text"] + current
                    newEmb = generateEmbedding(withPrev)
                    withPrevSim = cosineSimilarity(newEmb, queryEmb)

                    lineStart = phrases.loc[start - 1]["start"]
                    lineEnd = (
                        phrases.loc[start + length - 1]["start"]
                        + phrases.loc[start + length - 1]["length"]
                    )
                    millisStart = lines[lineStart]["start"]
                    millisEnd = lines[lineEnd]["end"]

                    withPrevDuration = millisEnd - millisStart

                if takeNext:
                    withNext = current + phrases.loc[start + length]["text"]
                    newEmb = generateEmbedding(withNext)
                    withNextSim = cosineSimilarity(newEmb, queryEmb)

                    lineStart = phrases.loc[start]["start"]
                    lineEnd = (
                        phrases.loc[start + length]["start"]
                        + phrases.loc[start + length]["length"]
                    )
                    millisStart = lines[lineStart]["start"]
                    millisEnd = lines[lineEnd]["end"]

                    withNextDuration = millisEnd - millisStart

                if takePrev and takeNext:
                    withBoth = (
                        phrases.loc[start - 1]["text"]
                        + current
                        + phrases.loc[start + length]["text"]
                    )
                    newEmb = generateEmbedding(withBoth)
                    withBothSim = cosineSimilarity(newEmb, queryEmb)

                    lineStart = phrases.loc[start - 1]["start"]
                    lineEnd = (
                        phrases.loc[start + length]["start"]
                        + phrases.loc[start + length - 1]["length"]
                    )
                    millisStart = lines[lineStart]["start"]
                    millisEnd = lines[lineEnd]["end"]

                    withBothDuration = millisEnd - millisStart

#                print(
#                    f"""start: {start} length: {length} p: {'t' if takePrev else 'f'} n: {'t' if takeNext else 'f'}
#sim(C, P, N, B): {"{:.4f}".format(currentSim)} {"{:.4f}".format(withPrevSim)} {"{:.4f}".format(withNextSim)} {"{:.4f}".format(withNextSim)}
#dur(C, P, N, B): {currentDuration} {withPrevDuration} {withNextDuration} {withBothDuration}
#"""
#                )

                if withBothSim > withPrevSim and withBothSim > withNextSim:
                    if (
                        withBothSim < currentSim
                        and withBothDuration > clipLengthRange[0]
                    ):
                        break

                    if (
                        withBothSim > currentSim
                        and withBothDuration > clipLengthRange[1]
                    ):
                        break

                    current = withBoth
                    currentSim = withBothSim
                    currentDuration = withBothDuration

                    start -= 1
                    length += 2

                    continue

                if withPrevSim > withNextSim:
                    if (
                        withPrevSim < currentSim
                        and withPrevDuration > clipLengthRange[0]
                    ):
                        break

                    if (
                        withPrevSim > currentSim
                        and withPrevDuration > clipLengthRange[1]
                    ):
                        break

                    current = withPrev
                    currentSim = withPrevSim
                    currentDuration = withPrevDuration

                    takeNext = False

                    start -= 1
                    length += 1

                if withNextSim > withPrevSim:
                    if (
                        withNextSim < currentSim
                        and withNextDuration > clipLengthRange[0]
                    ):
                        break

                    if (
                        withNextSim > currentSim
                        and withNextDuration > clipLengthRange[1]
                    ):
                        break

                    current = withNext
                    currentSim = withNextSim
                    currentDuration = withNextDuration

                    takePrev = False

                    length += 1

            lineStart = phrases.loc[start]["start"]
            lineEnd = (
                phrases.loc[start + length]["start"]
                + phrases.loc[start + length]["length"]
            )

            # Add the suggestion to the dataframe
            suggestions.loc[-1] = [lineStart, lineEnd - lineStart, current, currentSim]
            suggestions.index = suggestions.index + 1
            suggestions = suggestions.sort_index()

        selectedSuggestions = suggestions.sort_values(by="similarities", ascending=False).head(5)
        print(selectedSuggestions[["start", "length", "similarities"]])
    else:
        path = f"/tmp/{source.id}"
        phrases = pd.DataFrame()

        extractInterventions(path)

        queryEmb = generateQueryEmedding(source)
        addEmbeddingsToDf(phrases)


def cosineSimilarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


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


def addEmbeddingsToDf(df: pd.DataFrame):
    print("\n\n\nDon't forget to set this correctly\n\n\n")
    return pd.read_json(f"../public/phrases.json")
    embeddings = generateEmbeddingsFromDf(df)
    df["embedding"] = [embedding.embedding for embedding in embeddings]


def updateRowEmbeddings(df: pd.DataFrame, row: int):
    embeddings = generateRowEmbedding(df, row)
    df.at[row, "embedding"] = embeddings


def generateEmbeddingsFromDf(df: pd.DataFrame):
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

    return embeddings


def generateRowEmbedding(df: pd.DataFrame, row: int):
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )

    result = client.embeddings.create(
        input=df.at[row, "text"],
        model="text-embedding-3-small",
        encoding_format="float",
    )

    return result.data[0].embedding


def generateEmbedding(text: str):
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )

    result = client.embeddings.create(
        input=text,
        model="text-embedding-3-small",
        encoding_format="float",
    )

    return result.data[0].embedding
