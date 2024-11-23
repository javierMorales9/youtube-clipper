import os
import subprocess

from extractInterventions import Line, extractLines
from clip.Clip import Clip, Theme, ThemeShadow, ThemeStroke

from extractWordsFromFile import Word

def addSubtitlestoClip(path: str, clip: Clip, words: list[Word]):
    fontPath = os.environ["FONTS_PATH"]
    lines = extractLines(words)

    # Extract the ones that are in the clip. We multiply by 1000 to compare in millis
    linelevel_subtitles: list[Line] = []
    for line in lines:
        if (
            line["start"] >= clip.range.start * 1000
            and line["end"] <= clip.range.end * 1000
        ):
            linelevel_subtitles.append(line)

    assFile = generateAssFile(clip, linelevel_subtitles)

    with open(f"{path}/{clip.id}.ass", "w") as file:
        file.write(assFile)

    try:
        os.unlink(f"{path}/{clip.id}_temp.mp4")
    except:
        print(f"File: {path}/{clip.id}_temp.mp4 don't exist")

    arguments = [
        "ffmpeg",
        "-i",
        f"{path}/{clip.id}.mp4",
        "-vf",
        f"ass={path}/{clip.id}.ass:fontsdir={fontPath}",
        f"{path}/{clip.id}_temp.mp4",
    ]
    print("arguments", " ".join(arguments))

    result = subprocess.run(arguments, capture_output=True, text=True)
    result.stdout

    if result.returncode != 0:
        print("Error", result.stderr)
        raise Exception("Error adding subtitles", result.stderr)

    # Remove the original video and rename the new one
    os.unlink(f"{path}/{clip.id}.mp4")
    os.rename(
        f"{path}/{clip.id}_temp.mp4",
        f"{path}/{clip.id}.mp4",
    )

fonts = {
    "Arial": "Komika Axis",
}


def generateAssFile(clip: Clip, linelevel_subtitles: list[Line]):
    theme = clip.theme

    assText = f"""[Script Info]
Title: {clip.name}
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[Aegisub Project Garbage]
Last Style Storage: Styles
Audio File: ../files/4b3ef08c-a8b6-46f8-b241-dada7144624e/c5e37d43-28d0-43a4-a3fc-2b2da8d147de.mp4
Video File: ../files/4b3ef08c-a8b6-46f8-b241-dada7144624e/c5e37d43-28d0-43a4-a3fc-2b2da8d147de.mp4
Video AR Mode: 4
Video AR Value: 0.561111
Video Zoom Percent: 0.250000
Video Position: 178

[V4+ Styles]
"""
    style = {
        "Name": "Style",
        "Fontname": fonts[theme.themeFont],
        "Fontsize": theme.themeSize * 5,
        "PrimaryColour": f"&H00{theme.themeFontColor.replace('#', '')}",
        "SecondaryColour": f"&H00{theme.themeMainColor.replace('#', '')}",
        "OutlineColour": f"&H00{theme.themeStrokeColor.replace('#', '')}",
        "BackColour": f"&H00{theme.themeFontColor.replace('#', '')}",
        "Bold": 0,
        "Italic": 0,
        "Underline": 0,
        "StrikeOut": 0,
        "ScaleX": 100,
        "ScaleY": 100,
        "Spacing": 0,
        "Angle": 0,
        "BorderStyle": 1,
        "Outline": strokeStyle(theme),
        "Shadow": shadowStyle(theme),
        "Alignment": 7,
        "MarginL": 10,
        "MarginR": 10,
        "MarginV": 10,
        "Encoding": 1,
    }

    assText += f"Format: {", ".join([str(x) for x in list(style.keys())])}\n"
    assText += f"Style: {",".join([str(x) for x in list(style.values())])}\n"

    assText += "[Events]\n"
    assText += "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"

    start = linelevel_subtitles[0]["start"]
    for line in linelevel_subtitles:
        subtitle = f"Dialogue: 0,"
        subtitle += f"{time_str(line['start'] - start)},{time_str(line['end'] - start)}"
        subtitle += f",{style["Name"]},,0,0,0,,"

        subtitle += "{"
        subtitle += f"{shadowFilter(theme)}"
        subtitle += f"{positionFilter(theme)}"
        subtitle += "}"

        for word in line["words"]:
            diff = str(word["end"] - word["start"])
            diff = diff if len(diff) == 3 else "0" + diff
            length = str(int(diff[0:2]))

            text = word["word"]
            if theme.themeUpperText:
                text = text.upper()

            # subtitle += "{\\K" + length + "}" + text + " "
            subtitle += f"{text} "

        assText += subtitle + "\n"

    return assText


def time_str(millis: int):
    if not millis:
        return "00:00:00.0"

    hours = int(millis / (3600 * 1000))
    minutes = int((millis % (3600 * 1000)) / (60 * 1000))
    seconds = int((millis % (3600 * 1000)) % (60 * 1000) / 1000)
    millis = millis - seconds * 1000

    hoursStr = f"0{hours}:" if hours < 10 else f"{hours}:"
    minutesStr = f"0{minutes}:" if minutes < 10 else f"{minutes}:"
    secondsStr = f"0{seconds}" if seconds < 10 else f"{seconds}"
    millisStr = f".0{millis}" if millis < 10 else f".{str(millis)[0:2]}"

    return f"{hoursStr}{minutesStr}{secondsStr}{millisStr}"


def strokeStyle(theme: Theme):
    stroke = theme.themeStroke

    if stroke == ThemeStroke.NONE:
        return "0"
    elif stroke == ThemeStroke.SMALL:
        return 10
    elif stroke == ThemeStroke.MEDIUM:
        return 15
    elif stroke == ThemeStroke.LARGE:
        return 20

    return "0"


def shadowStyle(theme: Theme):
    return ""

    shadow = theme.themeShadow
    if shadow == ThemeShadow.NONE:
        return "0"
    elif shadow == ThemeShadow.SMALL:
        return 4
    elif shadow == ThemeShadow.MEDIUM:
        return 6
    elif shadow == ThemeShadow.LARGE:
        return 8

    return "0"

def positionFilter(theme: Theme):
    position = theme.themePosition

    return f"\\pos({500},{1920 * position/100})"

def shadowFilter(theme: Theme):
    return ""
    shadow = theme.themeShadow
    if shadow == ThemeShadow.NONE:
        return ""
    elif shadow == ThemeShadow.SMALL:
        return f"\\blur4\\be1"
    elif shadow == ThemeShadow.MEDIUM:
        return f"\\blur4\\be1"
    elif shadow == ThemeShadow.LARGE:
        return f"\\blur4\\be1"

    return ""
