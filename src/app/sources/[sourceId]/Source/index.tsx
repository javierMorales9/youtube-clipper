'use client';

import Timeline from "@/app/sources/[sourceId]/timeline";
import { useTimer } from "../useTimer";
import RangeSelection from "./rangeSelector";
import { useState } from "react";
import Link from "next/link";
import SourceVideo from "./sourceVideo";
import { Source } from "@/server/db/schema";

export default function SourceEditor({ source }: { source: Source }) {
  const timer = useTimer();

  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [rangeCreated, setRangeCreated] = useState(false);

  return (
    <div className="flex flex-col w-full items-center">
      <SourceVideo
        src={`${source.url}/adaptive.m3u8`}
        timer={timer}
        startTime={0}
        height={500}
      />

      <div className="w-full flex flex-col">
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
          source={source}
          currentTime={timer.currentTime}
          currentSeconds={timer.currentSeconds}
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
    </div>
  );
}
