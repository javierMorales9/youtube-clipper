'use client';

import Video from "@/app/sources/[sourceId]/video";
import Timeline from "@/app/sources/[sourceId]/timeline";
import { useTimer } from "../useTimer";
import RangeSelection from "./rangeSelector";
import { useState } from "react";
import Link from "next/link";

export default function Source({ source }: { source: any }) {
  const timer = useTimer();

  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [rangeCreated, setRangeCreated] = useState(false);

  return (
    <>
      <Video
        src={`${source.url}`}
        timer={timer}
      />

      <div className="flex flex-col">
        <button onClick={() => timer.togglePlay()}>{timer.playing ? 'Stop' : 'Play'}</button>
        {rangeCreated && (
          <Link href={`/sources/${source.id}/clips/new?start=${range[0]}&end=${range[1]}`}>
            Create Clip
          </Link>
        )}
      </div>

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
              range={range}
              setRange={setRange}
              rangeCreated={rangeCreated}
              setRangeCreated={setRangeCreated}
            />
          )}
        </Timeline>
      )}
    </>
  );
}
