import os
from clip.Clip import Clip, Section
import subprocess

from math import floor

from source.Source import Source


# Generate a clip from a source video.
# The clip is divided into sections, each section is divided into fragments.
# We generate a video for each section, and then concatenate them.
def generateClip(clip: Clip, source: Source, path: str):
    sects = len(clip.sections)

    for i in range(sects):
        section = clip.sections[i]
        # Generate the video for each section
        # We first trim the video to the section range with -ss and -to
        # so that we only process the necessary part of the video (30s - 3min)
        # 
        # Then, we apply the filter_complex to create the vertical video composed
        # of the fragments. (See sectionFilter)
        #
        # And then we just take the resulting video [v] and the audio of the original video
        # and save it in a new file.
        arguments = [
            "ffmpeg",
            "-i",
            f"{path}/original.mp4",
            "-ss",
            str(clip.range.start + section.start),
            "-to",
            str(clip.range.start + section.end),
            "-filter_complex",
            sectionFilter(clip, source, i, section),
            "-map",
            "[v]",
            "-map",
            "0:a?",
            "-y",
            f"{path}/{clip.id}_{i}.mp4",
        ]

        result = subprocess.run(arguments, capture_output=True, text=True)

        if result.returncode != 0:
            print("Error", result.stderr)
            raise Exception(f"Error generating section {i}", result.stderr)

    # Concatenate sections videos
    arguments = [
        "ffmpeg",
    ]

    # We add the section videos as inputs to the command
    for i in range(sects):
        arguments.extend(
            [
                "-i",
                f"{path}/{clip.id}_{i}.mp4",
            ]
        )

    # We concatenate the videos using the concat filter
    # and save the result in a new file
    arguments.extend(
        [
            "-filter_complex",
            f"concat=n={sects}:v=1:a=1[v][a]",
            "-map",
            "[v]",
            "-map",
            "[a]",
            "-y",
            f"{path}/{clip.id}.mp4",
        ]
    )

    result = subprocess.run(arguments, capture_output=True, text=True)

    if result.returncode != 0:
        print("Error", result.stderr)
        raise Exception("Error generating clip", result.stderr)

    # Remove section videos
    for i in range(sects):
        os.unlink(f"{path}/{clip.id}_{i}.mp4")


# It generates the filter for a section.
# The final result will be something like this:
#  [0:v]split=3[f00][f01][f02];
#    [f00]<crop>[e00];
#    [f01]<crop>[e01];
#  [e00][e01]vstack=inputs=3,setdar=1080/1920,scale=1080:1920[v]
#
# Basically we split the input video [0:v] in as many fragments as the section has.
# Then we generate a video for each fragment using the crop filter.
# Finally, we stack the videos vertically or horizontally, depending on the display,
# The final result is a single video [v] for the section.
def sectionFilter(clip, source, i, section):
    frags = len(section.fragments)

    fs = "".join(f"[f{i}{j}]" for j in range(frags))
    es = "".join(f"[e{i}{j}]" for j in range(frags))

    fragFilters = fragmentsString(clip, source, i, section)

    # If there is more than one fragment, we need to join them together
    # in a single video. We use the vstack and hstack filters. It takes the video of
    # each fragment and stacks them vertically or horizontally, depending on the
    # display, returning a single video for the section.
    stack = f"vstack=inputs={frags}," if frags > 1 else ""

    # The same case as the fragments, all section videos need to have the same
    # resolution to be able to concatenate them. We resize to the fixed 1080x1920
    # resolution.
    resize = f"setdar=1080/1920,scale=1080:1920"

    return f"[0:v]split={frags}{fs};{fragFilters};{es}{stack}{resize}[v]"


# It creates the videos for each fragment of the section.
# The final result will be something like this:
#   [fi0]<crop>,<resize>,...more filters,...[ei0];[fi1]<crop>,<resize>,...more filters,...[ei1];[fi2]...
#
# Being i the section order.
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

        firstWidth = section.fragments[0].width
        firstHeight = section.fragments[0].height

        # We generate a video for each fragment. We take the dimensions
        # and position of the fragment and use the crop filter to extract
        # that part of the video.
        crop = f"crop={cropWidth}:{cropHeight}:{cropX}:{cropY}"

        # We need to resize the fragment to the first fragment resolution to be able to stack them
        # Normally, the fragments resolution will differ by decimals, so the resize won't be noticeable
        # Basically, it is just for ffmpeg to be able to stack them
        resize = f"setdar={firstWidth}/{firstHeight},scale={firstWidth}:{firstHeight}"

        fragmentStr = f"[f{i}{j}]{crop},{resize}[e{i}{j}]"
        fragments.append(fragmentStr)

    return ";".join(fragments)
