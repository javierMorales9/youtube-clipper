'use client';
import { Timer } from "../../useTimer";
import { useMemo } from "react";
import { ClipType, SectionType, ThemeFont, ThemeShadow, ThemeStroke } from "@/server/entities/clip/domain/Clip";
import { SourceType } from "@/server/entities/source/domain/Source";
import { Displays } from "./Displays";
import { Line } from "@/app/utils";
import { useFormContext } from "react-hook-form";
import HLSReproducer from '../../HLSReproducer';

export function Preview({
  section,
  isOpen,
  closePreview,
  source,
  timer,
  startTime,
  dimensions,
  lines,
}: {
  section?: SectionType,
  isOpen: boolean,
  closePreview: () => void,
  source: SourceType,
  timer: Timer,
  startTime: number
  dimensions: [number, number],
  lines: Line[],
}) {

  return (
    <div
      className={`
        fixed top-0 left-0 w-full h-full
        ${isOpen ? 'flex' : 'hidden'}
        justify-center items-center
        bg-black bg-opacity-80
      `}
      onClick={closePreview}
    >
      <div onClick={(e) => {
        e.stopPropagation();
      }}>
        <div
          className="relative"
          style={{
            width: 270,
            height: 480,
          }}
        >
          <Captions
            previewWidth={270}
            previewHeight={480}
            lines={lines}
            timer={timer}
            startTime={startTime}
          />
          {section && section.fragments && section.fragments.map((fragment, i) => (
            <VideoFragment
              key={i}
              src={`${source.url!}`}
              timer={timer}
              startTime={startTime}
              dimensions={dimensions}
              defaultFragment={Displays[section.display]!.fragments[i]!}
              fragment={fragment}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoFragment({
  src,
  startTime = 0,
  timer,
  dimensions,
  defaultFragment,
  fragment,
}: {
  src: string,
  startTime: number,
  timer: Timer,
  dimensions: [number, number],
  defaultFragment: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
  fragment: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: defaultFragment.x,
        top: defaultFragment.y,
        width: fragment.width,
        height: fragment.height,
        transformOrigin: 'left top',
        transform: `scale(
          ${defaultFragment.width / fragment.width},
          ${defaultFragment.height / fragment.height}
        )`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: dimensions[0],
          height: dimensions[1],
          left: -fragment.x,
          top: -fragment.y,
        }}
      >
        <HLSReproducer
          src={src}
          startTime={startTime}
          timer={timer}
          muted={true}
        />
      </div>
    </div>
  );
}

function Captions({
  previewHeight,
  lines,
  timer,
  startTime,
}: {
  previewWidth: number,
  previewHeight: number,
  lines: Line[],
  timer: Timer,
  startTime: number,
}) {
  const { watch } = useFormContext<ClipType>();
  const theme = watch("theme");

  const fonts: Record<ThemeFont, string> = {
    [ThemeFont.Komika]: 'komika',
  };

  const currentLine = useMemo(() => {
    for (const line of lines) {
      if (
        timer.currentSeconds * 1000 - (line.start - startTime * 1000) >= 0
        && timer.currentSeconds * 1000 - (line.end - startTime * 1000) <= 0
      ) {
        return line;
      }
    }
  }, [timer.currentSeconds]);

  const shadow = () => {
    switch (theme.themeShadow) {
      case ThemeShadow.None:
        return 'none';
      case ThemeShadow.Small:
        return `0px 0px 70px ${theme.themeFontColor}`;
      case ThemeShadow.Medium:
        return `0px 0px 4px ${theme.themeFontColor}`;
      case ThemeShadow.Large:
        return `0px 0px 6px ${theme.themeFontColor}`;
    }
  }

  const stroke = () => {
    const base = `${theme.themeStrokeColor}`;

    switch (theme.themeStroke) {
      case ThemeStroke.None:
        return `none ${base}`;
      case ThemeStroke.Small:
        return `1px ${base}`;
      case ThemeStroke.Medium:
        return `2px ${base}`;
      case ThemeStroke.Large:
        return `3px ${base}`;
    }
  }

  return (
    <div
      className="absolute z-10 left-1/2 -translate-x-1/2 w-full p-5"
      style={{
        top: previewHeight * theme.themePosition / 100,
      }}
    >
      <div
        style={{
          fontSize: theme.themeSize,
          fontFamily: fonts[theme.themeFont],
          color: theme.themeFontColor,
          textShadow: shadow(),
          textAlign: 'center',
          WebkitTextStroke: stroke(),
        }}
      >
        {currentLine && (
          theme.themeUpperText
            ? currentLine.text.toUpperCase()
            : currentLine.text
        )}
      </div>
    </div>
  );
}

