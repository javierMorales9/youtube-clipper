'use client';

import { useState } from "react";
import Video from "./video";
import Timeline from "./timeline";

export default function Source({ source }: { source: any }) {
  const [length, setLength] = useState<number | null>(37);
  const [currentTime, setCurrentTime] = useState<[number, number]>([0, 0]);
  const [movie, setMovie] = useState<HTMLVideoElement | null>(null);

  function seek(time: number) {
    setCurrentTime(formatTime(time));
    movie!.currentTime = time;
  }

  function formatTime(time: number): [number, number] {
    return [Math.floor(time / 60), Math.floor(time % 60)];
  }


  return (
    <>
      <Video
        src={`${source.url}`}
        startTime={0}
        length={length}
        setLength={setLength}
        currentTime={currentTime}
        setCurrentTime={setCurrentTime}
        movie={movie}
        setMovie={setMovie}
      />

      {length && (
        <Timeline
          length={length}
          currentTime={currentTime}
          setCurrentTime={(time: number) => seek(time)}
        />
      )}
    </>
  );
}
