import os

from pydantic import BaseModel
from extractInterventions import extractLines
from extractWordsFromFile import Word
from suggestion.Suggestion import Suggestion
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


def createSuggestions(source: Source, words: list[Word]):
    env = os.environ["ENV"]

    if env == "dev":
        useCache = bool(os.environ["CACHE_FROM_FS"])
        path = os.environ["FILES_PATH"] if not useCache else f"../public/test"
    else:
        path = f"/tmp/{source.id}"
        useCache = False

    lines = extractLines(words)

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

    if useCache:
        phrases = pd.read_json(f"../public/test/phrases.json")
    else:
        addEmbeddingsToDf(phrases)

    queryEmb = generateQueryEmedding(source)

    phrases["similarities"] = phrases["embedding"].apply(
        lambda x: cosineSimilarity(x, queryEmb)
    )
    topPhrases = phrases.sort_values(by="similarities", ascending=False).head(10)
    print(topPhrases)

    selections = pd.DataFrame(
        columns=np.array(["start", "end", "text", "similarities"])
    )

    clipLengthRange = clipDurationRanges[source.clipLength or "<30s"]

    for i in range(0, len(topPhrases)):
        start = topPhrases.iloc[i]["index"]
        length = 1

        current = topPhrases.iloc[i]["text"]
        currentSim = topPhrases.iloc[i]["similarities"]

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
            # sim(C, P, N, B): {"{:.4f}".format(currentSim)} {"{:.4f}".format(withPrevSim)} {"{:.4f}".format(withNextSim)} {"{:.4f}".format(withNextSim)}
            # dur(P, N, B): {withPrevDuration} {withNextDuration} {withBothDuration}
            # """
            #                )

            if withBothSim > withPrevSim and withBothSim > withNextSim:
                if withBothSim < currentSim and withBothDuration > clipLengthRange[0]:
                    break

                if withBothSim > currentSim and withBothDuration > clipLengthRange[1]:
                    break

                current = withBoth
                currentSim = withBothSim

                start -= 1
                length += 2

                continue

            if withPrevSim > withNextSim:
                if withPrevSim < currentSim and withPrevDuration > clipLengthRange[0]:
                    break

                if withPrevSim > currentSim and withPrevDuration > clipLengthRange[1]:
                    break

                current = withPrev
                currentSim = withPrevSim

                takeNext = False

                start -= 1
                length += 1

            if withNextSim > withPrevSim:
                if withNextSim < currentSim and withNextDuration > clipLengthRange[0]:
                    break

                if withNextSim > currentSim and withNextDuration > clipLengthRange[1]:
                    break

                current = withNext
                currentSim = withNextSim

                takePrev = False

                length += 1

        lineStart = phrases.loc[start]["start"]
        lineEnd = (
            phrases.loc[start + length]["start"] + phrases.loc[start + length]["length"]
        )
        millisStart = lines[lineStart]["start"]
        millisEnd = lines[lineEnd]["end"]

        # Add the suggestion to the dataframe
        selections.loc[-1] = [millisStart, millisEnd, current, currentSim]
        selections.index = selections.index + 1
        selections = selections.sort_index()

    selectedSuggestions = selections.sort_values(
        by="similarities", ascending=False
    ).head(5)
    print(selectedSuggestions)

    addNameAndDescription(selectedSuggestions, source)

    selectedSuggestions.to_dict(orient="records")

    suggestions: list[Suggestion] = []
    for i in range(0, len(selectedSuggestions)):
        suggestions.append(
            Suggestion(
                id=None,
                sourceId=source.id,
                name=selectedSuggestions.iloc[i]["name"],
                description=selectedSuggestions.iloc[i]["description"],
                start=int(selectedSuggestions.iloc[i]["start"] / 1000),
                end=int(selectedSuggestions.iloc[i]["end"] / 1000),
            )
        )

    return suggestions


def cosineSimilarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def generateQueryEmedding(source: Source):
    name = source.name
    genre = source.genre
    tags = source.tags
    clipLength = source.clipLength

    queryText = f""" Imagine you are an editor for a famous podcast.
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


class SuggestionData(BaseModel):
    name: str
    description: str


def addNameAndDescription(df: pd.DataFrame, source: Source):
    client = OpenAI(
        api_key=os.environ.get("OPENAI_API_KEY"),
    )

    names = []
    descriptions = []
    for i in range(0, len(df)):
        text = df.iloc[i]["text"]
        result = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {
                    "role": "system",
                    "content": f"You are an editor for a famous podcast. \
You have already selected a clip from a new video. \
The transcription of the clip is {text}. \
The video from which the clip was taken is of the {source.genre} genre and has the following tags: {source.tags}.",
                },
                {
                    "role": "user",
                    "content": f"Can you generate a name and a description for the clip. \
The name should be short, under 60 words. The description should be a bit longer, under 100 words \
and very direct with few adjectives.",
                },
            ],
            response_format=SuggestionData,
        )

        data = result.choices[0].message.parsed
        if data is None:
            continue

        names.append(data.name)
        descriptions.append(data.description)

    df["name"] = names
    df["description"] = descriptions
