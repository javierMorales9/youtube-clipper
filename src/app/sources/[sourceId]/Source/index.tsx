'use client';

import Video from "./video";
import Timeline from "./timeline";
import { useTimer } from "../useTimer";
import RangeSelection from "./rangeSelector";

export default function Source({ source }: { source: any }) {
  const timer = useTimer();

  return (
    <>
      <Video
        src={`${source.url}`}
        startTime={0}
        timer={timer}
      />

      <button onClick={() => timer.togglePlay()}>{timer.playing ? 'Stop' : 'Play'}</button>

      {timer.length && (
        <Timeline
          length={timer.length}
          currentTime={timer.currentTime}
          setCurrentTime={(time: number) => timer.seek(time)}
        >
          {(timelineWidth: number, zoom: number, length: number) => (
            <RangeSelection
              timelineWidth={timelineWidth}
              zoom={zoom}
              length={length}
            />
          )}
        </Timeline>
      )}
    </>
  );
}
