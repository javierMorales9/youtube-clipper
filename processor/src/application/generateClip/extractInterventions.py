from typing import TypedDict
from typing import TypedDict

from entities.source.domain.Word import Word


class Line(TypedDict):
    text: str
    start: int
    end: int
    words: list[Word]


#
# Join the words into sentences of fixed length
# We get the words and the start and end time of each word
# But we want to group the words into sentences for multiple reasons:
# - In order to generate the rolling subtitles.
# - It is easier to make the beam search suggestions.
# The end result we want is a list of sentences, with the following structure:
# {
#     "text": "This is a sentence",
#     "start": 0,
#     "end": 1000,
#     "words": [
#         {
#             "word": "This",
#             "start": 0,
#             "end": 100
#         },
#         {
#             "word": "is",
#             "start": 100,
#             "end": 200
#         },
#         ...
#     ]
# }
#
# We determine if we have to go to the next line based on three criteria:
# - The maximum number of characters per line.
# - The maximum duration of a line in seconds.
#   If it takes to long, even if the are less words, we go to the next line
# - The maximum gap between words. If there is a gap between words where no one
#   is speaking, we go to the next line.
def groupWordsInLines(
    words: list[Word], maxChars: int = 15, maxDuration: int = 2500, maxGap: int = 1500
):
    lines: list[Line] = []
    line_words: list[Word] = []
    line_text = ""
    line_duration = 0

    for idx in range(len(words)):
        word_data = words[idx]

        line_words.append(word_data)

        line_text += word_data["word"] + " "
        line_duration += word_data["end"] - word_data["start"]

        line_gap = word_data["start"] - words[idx - 1]["end"]

        if (
            len(line_text) > maxChars
            or line_duration > maxDuration
            or line_gap > maxGap
            or idx == len(words) - 1
        ) and len(line_words) > 0:
            lines.append(
                {
                    "text": line_text,
                    "start": line_words[0]["start"],
                    "end": line_words[-1]["end"],
                    "words": line_words,
                }
            )
            line_words = []
            line_duration = 0
            line_text = ""

    return lines
