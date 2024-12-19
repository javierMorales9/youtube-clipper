'use client';

import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';
import { Timer } from "../../useTimer";
import { useEffect, useMemo, useRef } from "react";
import { ThemeFont, ThemeShadow, ThemeStroke } from "@/server/entities/clip/domain/Clip";
import { SourceType } from "@/server/entities/source/domain/Source";
import { Clip, SectionFront } from "../Clip";
import { Line } from "@/app/utils";
import { useFormContext } from "react-hook-form";

export function Preview({
  section,
  isOpen,
  closeModal,
  source,
  timer,
  startTime,
  dimensions,
  lines,
}: {
  section?: SectionFront,
  isOpen: boolean,
  closeModal: () => void,
  source: SourceType,
  timer: Timer,
  startTime: number
  dimensions: [number, number],
  lines: Line[],
}) {

  const factor = 440 / 480

  return (
    <div
      className={`
        fixed top-0 left-0 w-full h-full
        ${isOpen ? 'flex' : 'hidden'}
        justify-center items-center
        bg-black bg-opacity-80
      `}
      onClick={closeModal}
    >
      <div onClick={(e) => {
        e.stopPropagation();
      }}>
        <div
          className="relative"
          style={{
            width: 270 * factor,
            height: 480 * factor,
          }}
        >
          <Captions
            previewWidth={270 * factor}
            previewHeight={480 * factor}
            lines={lines}
            timer={timer}
            startTime={startTime}
          />
          {section && section.fragments && section.fragments.map((element, i) => (
            <VideoFragment
              key={i}
              src={`${source.url!}`}
              timer={timer}
              startTime={startTime}
              dimensions={[dimensions[0] * factor, dimensions[1] * factor]}
              x={section.display!.elements[i]!.x * factor}
              y={section.display!.elements[i]!.y * factor}
              width={section.display!.elements[i]!.width * factor}
              height={section.display!.elements[i]!.height * factor}
              clip={{
                x: element.x * factor,
                y: element.y * factor,
                width: element.width * factor,
                height: element.height * factor,
              }}
            />
          ))}
        </div>
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
  const { getValues: vals, watch } = useFormContext<Clip>();
  const theme = watch("theme");

  const fonts: Record<ThemeFont, string> = {
    [ThemeFont.Arial]: 'komika',
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

function VideoFragment({
  src,
  startTime = 0,
  timer: {
    currentTime,
    playing,
    currentSeconds
  },
  dimensions,
  x,
  y,
  width,
  height,
  clip: {
    x: clipX,
    y: clipY,
    width: clipWidth,
    height: clipHeight,
  },
}: {
  src: string,
  startTime: number,
  timer: Timer,
  dimensions: [number, number],
  x: number,
  y: number,
  width: number,
  height: number,
  clip: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
}) {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      video.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: false,
        responsive: true,
        muted: true,
        fluid: true,
        sources: [{
          src,
          type: 'application/x-mpegURL'
        }],
      },
        () => {
          videojs.log('player is ready');
        }
      );
    }
  }, [videoRef]);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  useEffect(() => {
    const movie = playerRef.current;
    if (!movie) return;

    movie.width(dimensions[0]);
    movie.height(dimensions[1]);
  }, [dimensions]);

  useEffect(() => {
    const movie = playerRef.current;
    if (movie) {
      movie.currentTime(startTime + currentSeconds);
    }
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    playerRef?.current?.pause();
  }

  function play() {
    playerRef?.current?.play()?.catch(console.error);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: clipWidth,
        height: clipHeight,
        transformOrigin: 'left top',
        transform: `scale(${width / clipWidth}, ${height / clipHeight})`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: dimensions[0],
          height: dimensions[1],
          left: -clipX,
          top: -clipY,
        }}
      >
        <div data-vjs-player>
          <div ref={videoRef} />
        </div>
      </div>
    </div>
  );
}
