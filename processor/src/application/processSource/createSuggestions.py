import json
from typing import TypedDict
from pydantic import BaseModel
from application.generateClip.extractInterventions import Line, groupWordsInLines
from entities.source.domain.Word import Word
from entities.suggestion.domain.Suggestion import Suggestion
from entities.source.domain.Source import Source
import numpy as np
from entities.shared.domain.aiModel import AIModel

clipDurationRanges = {
    "<30s": [0, 30000],
    "30s-1m": [30000, 60000],
    "1m-1.5m": [60000, 90000],
    "1.5m-3m": [90000, 180000],
    "3m-5m": [180000, 300000],
    "5m-10m": [300000, 600000],
    "10m-15m": [600000, 900000],
}


class SuggestionRange(TypedDict):
    start_line: int
    end_line: int


def createSuggestions(aiModel: AIModel, source: Source, words: list[Word]):
    lines = groupWordsInLines(words, maxChars=30, maxDuration=5000)

    """
    queryEmb = generateQueryEmedding(source, suggestionModel)
    embeddings = suggestionModel.generateEmbeddingsFromList(
        [line["text"] for line in lines]
    )
    similarities = [
        cosineSimilarity(embeddings[i], queryEmb) for i in range(len(embeddings))
    ]
    json.dump(similarities, open("similarities.json", "w"))
    """
    similarities = json.load(open("similarities.json", "r"))

    clipDurationRange = clipDurationRanges[source.clipLength or "<30s"]
    minClipDuration = clipDurationRange[0]
    maxClipDuration = clipDurationRange[1]

    # A list of the top <lineCount> lines to create suggestions from.
    # E.g. [970, 91, 1741, 1563, 698 ...]
    lineCount = 5
    topLineIndexes = getTopLines(lineCount, maxClipDuration, similarities, lines)
    print("topLineIndexes", topLineIndexes)

    for i in range(1001, 1002):
        line = lines[i]
        print(
            line["text"],
            toReadableTime(int(line["start"] / 1000)),
            toReadableTime(int(line["end"] / 1000)),
        )

    suggestionRanges: list[SuggestionRange] = []
    for topLineIndex in topLineIndexes:
        suggestionRange: SuggestionRange = {
            "start_line": topLineIndex,
            "end_line": topLineIndex,
        }
        while True:
            suggestionRange["start_line"] -= 1
            suggestionRange["end_line"] += 1

            endMillis = lines[suggestionRange["end_line"]]["end"]
            startMillis = lines[suggestionRange["start_line"]]["start"]
            suggestionDuration = endMillis - startMillis

            if (
                suggestionDuration > minClipDuration
                and suggestionDuration < maxClipDuration
            ):
                break

        suggestionRanges.append(suggestionRange)

    print("suggestion ranges", suggestionRanges)

    suggestions: list[Suggestion] = []
    for suggestionRange in suggestionRanges:
        start_line = suggestionRange["start_line"]
        end_line = suggestionRange["end_line"]

        start = int(lines[start_line]["start"] / 1000)
        end = int(lines[end_line - 1]["end"] / 1000)

        text = " "
        for i in range(start_line, end_line):
            text += lines[i]["text"] + " "

        data = generateNameAndDescription(text, aiModel, source)
        name = data.name if data is not None else "No name"
        description = data.description if data is not None else "No description"

        suggestions.append(
            Suggestion(
                id=None,
                sourceId=source.id,
                companyId=source.companyId,
                name=name,
                description=description,
                start=start,
                end=end,
            )
        )

    return suggestions


def toReadableTime(time: int, alwaysHours: bool = False):
    if not time:
        return "00:00" if not alwaysHours else "00:00:00"

    hours = time // 3600
    minutes = (time % 3600) // 60
    seconds = time % 60

    hoursStr = f"{hours}:" if hours > 0 or alwaysHours else ""
    minutesStr = f"{minutes:02d}:"
    secondsStr = f"{seconds:02d}"

    return f"{hoursStr}{minutesStr}{secondsStr}"


def cosineSimilarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def generateQueryEmedding(source: Source, suggestionModel: AIModel):
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

    return suggestionModel.generateEmbedding(query)


def getTopLines(
    lineCount: int, maxClipDuration: int, similarities: list[int], lines: list[Line]
):
    orderedSimilarities = orderSimilarities(similarities)

    topLineIndexes: list[int] = []
    for sim in orderedSimilarities:
        index: int = sim["id"]

        if checkCollision(index, topLineIndexes, lines, maxClipDuration):
            continue

        topLineIndexes.append(index)

        if len(topLineIndexes) == lineCount:
            break

    return topLineIndexes


def checkCollision(
    index: int,
    topLineIndexes: list[int],
    lines: list[Line],
    minSuggestionSeparation: int,
):
    line = lines[index]
    for topLineIndex in topLineIndexes:
        topLine = lines[topLineIndex]

        if line["start"] > topLine["start"]:
            lineSeparation = line["start"] - topLine["end"]
        else:
            lineSeparation = topLine["start"] - line["end"]

        if lineSeparation < minSuggestionSeparation:
            return True

    return False


class OrderedSimilarity(TypedDict):
    id: int
    similarity: int


def orderSimilarities(similarities: list[int]) -> list[OrderedSimilarity]:
    orderedSimilarities: list[OrderedSimilarity] = []
    for i in range(len(similarities)):
        orderedSimilarities.append(
            {
                "id": i,
                "similarity": similarities[i],
            }
        )

    orderedSimilarities = sorted(
        orderedSimilarities, key=lambda x: x["similarity"], reverse=True
    )

    return orderedSimilarities


class SuggestionData(BaseModel):
    name: str
    description: str


def generateNameAndDescription(text: str, suggestionModel: AIModel, source: Source):
    return suggestionModel.jsonCall(
        roleText=f"You are an editor for a famous podcast. \
You have already selected a clip from a new video. \
The transcription of the clip is {text}. \
The video from which the clip was taken is of the {source.genre} genre and has the following tags: {source.tags}.",
        userText=f"Can you generate a name and a description for the clip. \
The name should be short, under 60 words. The description should be a bit longer, under 100 words \
and very direct with few adjectives. All the text should be in english",
        format=SuggestionData,
    )
