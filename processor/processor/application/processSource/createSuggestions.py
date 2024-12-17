from pydantic import BaseModel
from application.generateClip.extractInterventions import extractLines
from entities.source.Word import Word
from entities.suggestion.Suggestion import Suggestion
from entities.source.Source import Source
import numpy as np
import pandas as pd
from entities.shared.aiModel import AIModel

clipDurationRanges = {
    "<30s": [0, 30000],
    "30s-1m": [30000, 60000],
    "1m-1.5m": [60000, 90000],
    "1.5m-3m": [90000, 180000],
    "3m-5m": [180000, 300000],
    "5m-10m": [300000, 600000],
    "10m-15m": [600000, 900000],
}


def createSuggestions(
    suggestionModel: AIModel, source: Source, words: list[Word]
):
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

    phrases["embedding"] = suggestionModel.generateEmbeddingsFromList(
        phrases["text"].to_list()
    )

    queryEmb = generateQueryEmedding(source, suggestionModel)

    phrases["similarities"] = phrases["embedding"].apply(
        lambda x: cosineSimilarity(x, queryEmb)
    )
    topPhrases = phrases.sort_values(by="similarities", ascending=False).head(10)
    print("top phrases", topPhrases)

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
                newEmb = suggestionModel.generateEmbedding(withPrev)
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
                newEmb = suggestionModel.generateEmbedding(withNext)
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
                newEmb = suggestionModel.generateEmbedding(withBoth)
                withBothSim = cosineSimilarity(newEmb, queryEmb)

                lineStart = phrases.loc[start - 1]["start"]
                lineEnd = (
                    phrases.loc[start + length]["start"]
                    + phrases.loc[start + length - 1]["length"]
                )
                millisStart = lines[lineStart]["start"]
                millisEnd = lines[lineEnd]["end"]

                withBothDuration = millisEnd - millisStart

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

    addNameAndDescription(selectedSuggestions, suggestionModel, source)

    selectedSuggestions.to_dict(orient="records")

    suggestions: list[Suggestion] = []
    for i in range(0, len(selectedSuggestions)):
        suggestions.append(
            Suggestion(
                id=None,
                sourceId=source.id,
                companyId=source.companyId,
                name=selectedSuggestions.iloc[i]["name"],
                description=selectedSuggestions.iloc[i]["description"],
                start=int(selectedSuggestions.iloc[i]["start"] / 1000),
                end=int(selectedSuggestions.iloc[i]["end"] / 1000),
            )
        )

    return suggestions


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


class SuggestionData(BaseModel):
    name: str
    description: str


def addNameAndDescription(
    df: pd.DataFrame, suggestionModel: AIModel, source: Source
):
    names = []
    descriptions = []
    for i in range(0, len(df)):
        text = df.iloc[i]["text"]
        data = suggestionModel.jsonCall(
            roleText=f"You are an editor for a famous podcast. \
You have already selected a clip from a new video. \
The transcription of the clip is {text}. \
The video from which the clip was taken is of the {source.genre} genre and has the following tags: {source.tags}.",
            userText=f"Can you generate a name and a description for the clip. \
The name should be short, under 60 words. The description should be a bit longer, under 100 words \
and very direct with few adjectives.",
            format=SuggestionData,
        )

        if data is None:
            continue

        names.append(data.name)
        descriptions.append(data.description)

    df["name"] = names
    df["description"] = descriptions
