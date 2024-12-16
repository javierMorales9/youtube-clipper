from typing import TypedDict
from typing import TypedDict

from entities.source.Word import Word

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
def extractLines(
    words: list[Word], maxChars: int = 15, maxDuration: int = 2500, maxGap: int = 1500
):
    interventions: list[Line] = []
    line: list[Word] = []
    line_duration = 0

    for idx, word_data in enumerate(words):
        start = word_data["start"]
        end = word_data["end"]

        line.append(word_data)
        line_duration += end - start

        # Check if adding a new word exceeds the maximum character count or duration
        temp = " ".join(item["word"] for item in line)
        new_line_chars = len(temp)
        duration_exceeded = line_duration > maxDuration
        chars_exceeded = new_line_chars > maxChars

        # Check if the max time with no speech has been exceeded
        if idx > 0:
            gap = word_data["start"] - words[idx - 1]["end"]
            maxgap_exceeded = gap > maxGap
        else:
            maxgap_exceeded = False

        # If we have exceded any criteria, we finish the line and start a new one
        if duration_exceeded or chars_exceeded or maxgap_exceeded:
            if line:
                subtitle_line: Line = {
                    "text": " ".join(item["word"] for item in line),
                    "start": line[0]["start"],
                    "end": line[-1]["end"],
                    "words": line,
                }
                interventions.append(subtitle_line)
                line = []
                line_duration = 0

    # Add the last line
    if line:
        subtitle_line = {
            "text": " ".join(item["word"] for item in line),
            "start": line[0]["start"],
            "end": line[-1]["end"],
            "words": line,
        }
        interventions.append(subtitle_line)

    return interventions


def toMillis(timeStr):
    fromStr, millis = timeStr.split(".")

    if len(millis) < 3:
        millis = millis + "0" * (3 - len(millis))

    return int(fromStr) * 1000 + int(millis)
