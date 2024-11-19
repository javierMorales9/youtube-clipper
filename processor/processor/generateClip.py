from clip.Clip import Clip, Section
import subprocess

from math import floor

from source.Source import Source


def generateClip(clip: Clip, source: Source, path: str):
    sects = len(clip.sections)

    split = f"[0:v]split={sects}"
    ss = "".join(f"[s{i}]" for i in range(sects))
    vs = "".join(f"[v{i}]" for i in range(sects))

    sections = sectionsString(clip, source)

    filters = f"{split}{ss};{';'.join(sections)};{vs}concat=n={sects}:v=1[v]"

    arguments = [
        "ffmpeg",
        "-i",
        f"{path}/original.mp4",
        "-ss",
        str(clip.range.start),
        "-to",
        str(clip.range.end),
        "-filter_complex",
        filters,
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-y",
        f"{path}/{clip.id}.mp4",
    ]

    print("arguments", " ".join(arguments))
    result = subprocess.run(arguments, capture_output=True, text=True)

    if result.returncode != 0:
        print("Error", result.stderr)
        raise Exception("Error generating clip", result.stderr)


def sectionsString(clip: Clip, source: Source):
    sects = len(clip.sections)

    sections = []
    for i in range(sects):
        section = clip.sections[i]
        frags = len(section.fragments)

        fs = "".join(f"[f{i}{j}]" for j in range(frags))
        es = "".join(f"[e{i}{j}]" for j in range(frags))

        trim = f"trim=start={clip.range.start + section.start}:end={clip.range.start + section.end}"
        split = f"split={frags}"

        fragments = fragmentsString(clip, source, i, section)

        stack = f"vstack=inputs={frags}," if frags > 1 else ""
        aspectRatio = f"setdar=1080/1920,"
        scale = f"scale=1080:1920"
        #scale = f"scale=316:562"

        sectionStr = f"[s{i}]{trim},{split}{fs};{';'.join(fragments)};{es}{stack}{aspectRatio}{scale}[v{i}]"
        sections.append(sectionStr)

    return sections


def fragmentsString(clip: Clip, source: Source, i: int, section: Section):
    if source.width is None or source.height is None:
        raise Exception("Source resolution is missing")

    frags = len(section.fragments)

    fragments = []
    for j in range(frags):
        fragment = section.fragments[j]

        cropWidth = floor(fragment.width / clip.width * source.width)
        cropHeight = floor(fragment.height / clip.height * source.height)
        cropX = floor(fragment.x / clip.width * source.width)
        cropY = floor(fragment.y / clip.height * source.height)

        crop = f"crop={cropWidth}:{cropHeight}:{cropX}:{cropY}"

        fragmentStr = f"[f{i}{j}]{crop}[e{i}{j}]"
        fragments.append(fragmentStr)

    return fragments
