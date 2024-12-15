import json

from source.Word import Word

def extractWordsFromFile(path: str):
    print("Extracting words from transcription file")
    f = open(f"{path}/transcription.json", "r")
    data = json.load(f)
    results = data["results"]["items"]

    words: list[Word] = []
    for i in range(len(results)):
        word = results[i]["alternatives"][0]["content"]

        if "start_time" not in results[i] or "end_time" not in results[i]:
            continue

        start = toMillis(results[i]["start_time"])
        end = toMillis(results[i]["end_time"])

        words.append(
            {
                "word": word,
                "start": start,
                "end": end,
            }
        )

    return words

def toMillis(timeStr):
    fromStr, millis = timeStr.split(".")

    if len(millis) < 3:
        millis = millis + "0" * (3 - len(millis))

    return int(fromStr) * 1000 + int(millis)
