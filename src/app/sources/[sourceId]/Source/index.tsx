'use client';

import Video from "./video";
import Timeline from "./timeline";
import { useTimer } from "../useTimer";

export default function Source({ source }: { source: any }) {
  const timer = useTimer();

  return (
    <>
      <Video
        src={`${source.url}`}
        startTime={0}
        timer={timer}
      />

      {timer.length && (
        <Timeline
          length={timer.length}
          currentTime={timer.currentTime}
          setCurrentTime={(time: number) => timer.seek(time)}
        />
      )}
    </>
  );
}
