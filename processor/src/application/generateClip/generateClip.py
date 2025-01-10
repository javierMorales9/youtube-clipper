from typing import Optional
from enum import Enum

from entities.clip.domain.Clip import Clip, Section

from entities.clip.domain.clipRepository import ClipRepository
from entities.event.domain.Event import Event
from application.generateClip.addSubtitlestoClip import addSubtitlestoClip
from entities.source.domain.sourceRepository import SourceRepository

from entities.source.domain.Source import Source
from entities.shared.domain.fileHandler import FileHandler
from entities.shared.domain.system import System


class DisplayName(str, Enum):
    One = "One"
    TwoColumn = "TwoColumn"
    TwoRow = "TwoRow"


displays = {
    "One": [
        { "x": 0, "y": 0, "width": 1, "height": 1, }
    ],
    "TwoColumn": [
        { "x": 0, "y": 0, "width": 1, "height": 1 / 2, },
        { "x": 0, "y": 1 / 2, "width": 1, "height": 1 / 2, },
    ],
    "TwoRow": [
        { "x": 0, "y": 0, "width": 1 / 2, "height": 1, },
        { "x": 1 / 2, "y": 0, "width": 1 / 2, "height": 1, },
    ],
}


def generateClip(
    sourceRepo: SourceRepository,
    clipRepo: ClipRepository,
    sys: System,
    fileHandler: FileHandler,
    event: Event,
):
    # fileHandler.downloadFiles(keys=["original.mp4"])

    source = sourceRepo.findSourceById(event.sourceId)
    if source is None:
        return

    clip: Optional[Clip] = None
    if event.clipId is not None:
        clip = clipRepo.findClipById(event.clipId)

    if clip is None:
        return

    print(f"Processing clip {event.clipId}")

    generateClipFile(clip, source, sys)

    words = sourceRepo.getClipWords(clip.range, source.id)
    addSubtitlestoClip(clip, words, sys)

    clipRepo.finishClipProcessing(clip.id)

    # fileHandler.saveFiles()


# Generate a clip from a source video.
# The clip is divided into sections, each section is divided into fragments.
# We generate a video for each section, and then concatenate them.
def generateClipFile(clip: Clip, source: Source, sys: System):
    sects = len(clip.sections)

    for i in range(sects):
        generateSectionFile(sys, i, clip, source)

    concatSectionFiles(sys, clip)

    """
    # Remove section videos
    for i in range(sects):
        sys.rm(f"{clip.id}_{i}.mp4")
        # os.unlink(sys.path(f"{clip.id}_{i}.mp4"))
    """


def generateSectionFile(sys: System, i: int, clip: Clip, source: Source):
    if source.width is None or source.height is None:
        raise Exception("Source resolution is missing")

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
        sys.path("original.mp4"),
        "-ss",
        str(clip.range.start + section.start),
        "-to",
        str(clip.range.start + section.end),
        "-filter_complex",
        sectionFilter(section, source.width, source.height),
        "-map",
        "[v]",
        "-map",
        "0:a?",
        "-y",
        sys.path(f"{clip.id}_{i}.mp4"),
    ]
    print(" ".join(arguments))

    result = sys.run(arguments)

    print("Result", result[2])
    if result[2] != 0:
        print("Error", result[1])
        raise Exception(f"Error generating section {i}")


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
def sectionFilter(section: Section, sourceWidth: float, sourceHeight: float):
    frags = len(section.fragments)

    fs = "".join(f"[f{i}]" for i in range(frags))
    es = "".join(f"[e{i}]" for i in range(frags))

    fragFilters = fragmentsString(section, sourceWidth, sourceHeight)

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
def fragmentsString(section: Section, sourceWidth: float, sourceHeight: float):
    frags = len(section.fragments)

    fragments = []
    for i in range(frags):
        fragment = section.fragments[i]
        display = displays[section.display][i]

        fragmentWidth = float(1080 * display["width"])
        fragmentHeight = float(1920 * display["height"])
        print(f"Fragment {i} {fragmentWidth}x{fragmentHeight}")

        cropX = fragment.x * sourceWidth
        cropY = fragment.y * sourceHeight
        cropHeight = fragment.size * sourceHeight
        cropWidth = float(cropHeight) * fragmentWidth / fragmentHeight

        # We generate a video for each fragment. We take the dimensions
        # and position of the fragment and use the crop filter to extract
        # that part of the video.
        crop = f"crop={cropWidth}:{cropHeight}:{cropX}:{cropY}"

        # We need to resize the fragment to the first fragment resolution to be able to stack them
        # Normally, the fragments resolution will differ by decimals, so the resize won't be noticeable
        # Basically, it is just for ffmpeg to be able to stack them
        resize = f"setdar={fragmentWidth}/{fragmentHeight},scale={fragmentWidth}:{fragmentHeight}"

        fragmentStr = f"[f{i}]{crop},{resize}[e{i}]"
        fragments.append(fragmentStr)

    return ";".join(fragments)


def concatSectionFiles(sys: System, clip: Clip):
    sects = len(clip.sections)
    # Concatenate sections videos
    arguments = [
        "ffmpeg",
    ]

    # We add the section videos as inputs to the command
    for i in range(sects):
        arguments.extend(
            [
                "-i",
                sys.path(f"{clip.id}_{i}.mp4"),
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
            sys.path(f"{clip.id}.mp4"),
        ]
    )

    result = sys.run(arguments)

    if result[2] != 0:
        print("Error", result[1])
        raise Exception("Error generating clip", result[1])
