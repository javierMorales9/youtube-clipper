from clip.Clip import Clip
import subprocess

from math import floor

from source.Source import Source

path = "public/files"

def clipUpdated(clip: Clip, source: Source):
    if source.width is None or source.height is None:
        raise Exception('Source resolution is missing')

    header = f'ffmpeg -i {path}/{clip.sourceId}/original.mp4 -ss {clip.range.start} -to {clip.range.end} '

    ss = ''.join(f'[s{i}]' for i in clip.sections)
    filters = f'-filter_complex "[0:v]split={len(clip.sections)}{ss};'
    concat = ''
    for i in range(len(clip.sections)):
        section = clip.sections[i];
        fragLen = len(section.fragments)

        fs = ''.join(f'[f{i}{j}]' for j in section.fragments)
        filters += f'[s{i}]split={fragLen}{fs};'
        for j in range(fragLen):
          fragment = section.fragments[j]
          cropWidth = floor(fragment.width / clip.width * source.width)
          cropHeight = floor(fragment.height / clip.height * source.height)
          cropX = floor(fragment.x / clip.width * source.width)
          cropY = floor(fragment.y / clip.height * source.height)
          filters += f'[f{i}{j}]crop=${cropWidth}:{cropHeight}:{cropX}:{cropY}[e{i}{j}];'

          es = ''.join(f'[e{i}{j}]' for i in section.fragments)
          filters += f'{es}vstack=inputs={fragLen},' if fragLen > 1 else f'[e${i}0]'
          filters += f'scale=1080:1920[v{i}];';
          concat += f'[v${i}]';

    filters += f'{concat}concat=n={len(clip.sections)}[v]"';

    footer = f'-map "[v]" -map 0:a? -y {path}/{clip.sourceId}/{clip.id}.mp4';

    command = header + filters + footer;

    print(command);
    result = subprocess.run(command, text=True)
    result.stdout

    if result.stderr:
        print('stderr:', result.stderr);
