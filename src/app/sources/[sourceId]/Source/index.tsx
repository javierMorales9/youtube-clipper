'use client';

import Timeline from "@/app/sources/[sourceId]/timeline";
import { useTimer } from "../useTimer";
import RangeSelection from "./rangeSelector";
import { useState } from "react";
import Link from "next/link";
import Back from "../../../../../public/images/Back.svg";
import Play from "../../../../../public/images/MaterialSymbolsPlayArrow.svg";
import Pause from "../../../../../public/images/Pause.svg";
import SourceVideo from "./sourceVideo";
import { Source } from "@/server/db/schema";
import { useRouter } from "next/navigation";
import { toReadableTime } from "@/app/utils";
import Download from "../../../../../public/images/Download.svg";
import Loading from "../../../../../public/images/Loading.svg";

export default function SourceEditor({
  source,
  clips,
  timelineUrl,
}: {
  source: Source,
  clips: any[],
  timelineUrl: string,
}) {
  const timer = useTimer();
  const router = useRouter();

  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [rangeCreated, setRangeCreated] = useState<boolean>(false);
  const [zoom, setZoom] = useState(1);

  const toClip = () => {
    router.push(`/sources/${source.id}/clips/new?start=${range[0]}&end=${range[1]}`);
  }

  const downloadClip = async (clip: any) => {
    console.log('Downloading clip', clip);
  }

  return (
    <div className="flex flex-row">
      <div className="flex flex-col gap-y-2 w-1/4">
        <Link
          href="/sources"
          className="flex flex-row items-center gap-x-2 text-gray-600"
        >
          <Back className="fill-gray-600 w-6 h-6 " />
          <span
            className="text-lg font-semibold"
          >
            Go back
          </span>
        </Link>
        <div className="p-4 border bg-gray-50 rounded flex flex-col gap-y-3">
          <h1 className="text-xl font-semibold">
            Clips
          </h1>
          <div className="w-full flex flex-row justify-between flex-wrap">
            {clips.map((clip) => (
              <button
                key={clip.id}
                onClick={() => router.push(`/sources/${source.id}/clips/${clip.id}`)}
                className={`
                  flex flex-row justify-between items-center cursor-pointer
                  p-2 w-full rounded-lg bg-gray-100
               `}
                disabled={clip.processing}
              >
                <div className="flex flex-col">
                  <span className="flex justify-start">
                    {clip.name}
                  </span>
                  <span className="flex justify-start">
                    {toReadableTime(clip.range.start)} - {toReadableTime(clip.range.end)}
                  </span>
                </div>
                <div className="">
                  {clip.processing && (
                    <div className="">
                      <Loading className="w-10 h-10 fill-gray-400" />
                    </div>
                  )}
                  {!clip.processing && (
                    <div
                      className=""
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadClip(clip)
                      }}
                    >
                      <Download className="w-10 h-10 fill-gray-400" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full items-center">
        <SourceVideo
          src={source.url!}
          timer={timer}
          startTime={0}
          height={500}
        />

        <div className="relative w-full flex flex-row justify-center py-4">
          <div className="flex flex-row gap-x-4">
            <button onClick={() => timer.togglePlay()}>
              {timer.playing ?
                <Pause className="w-7 h-7 fill-none stroke-gray-700" /> :
                <Play className="w-7 h-7 fill-none stroke-gray-700" />
              }
            </button>
            <div>{toReadableTime(timer.currentSeconds)}</div>
            <div className="w-full flex flex-col items-start">
              <input
                type="range"
                min={1}
                max={10}
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
              />
            </div>
          </div>
          <button
            onClick={toClip}
            className={`
                absolute right-0 text-white px-4 py-2 rounded-lg
                ${rangeCreated ? 'bg-blue-500' : 'bg-blue-200'}
              `}
            disabled={!rangeCreated}
          >
            Create Clip
          </button>
        </div>


        {timer.length && (
          <Timeline
            length={timer.length}
            imageUrl={timelineUrl}
            source={source}
            currentTime={timer.currentTime}
            currentSeconds={timer.currentSeconds}
            setCurrentTime={(time: number) => timer.seek(time)}
            zoom={zoom}
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
    </div>
  );
}
