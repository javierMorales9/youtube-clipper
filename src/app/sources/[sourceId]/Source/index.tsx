'use client';

import Timeline from "@/app/sources/[sourceId]/Timeline";
import { useTimer } from "../useTimer";
import RangeSelection from "./RangeSelector";
import { useState } from "react";
import Link from "next/link";
import Back from "../../../../../public/images/Back.svg";
import Play from "../../../../../public/images/MaterialSymbolsPlayArrow.svg";
import Pause from "../../../../../public/images/Pause.svg";
import HLSReproducer from "./HLSReproducer";
import { Source } from "@/server/db/schema";
import { useRouter } from "next/navigation";
import { toReadableTime } from "@/app/utils";
import Download from "../../../../../public/images/Download.svg";
import Loading from "../../../../../public/images/Loading.svg";
import { Clip } from "@/server/api/clips/ClipSchema";
import { Suggestion } from "@/server/api/clips/SuggestionSchema";
import MP4Reproducer from "./MP4Reproducer";
import ClipsAndSuggestions from "./ClipsAndSuggestions";

export default function SourceEditor({
  source,
  clips,
  suggestions,
  timelineUrl,
  hls,
}: {
  source: Source,
  clips: Clip[],
  suggestions: Suggestion[],
  timelineUrl: string,
  hls: boolean,
}) {
  const timer = useTimer();
  const router = useRouter();

  const [pannel, setPannel] = useState<"clips" | "suggestions">("clips");

  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [rangeCreated, setRangeCreated] = useState<boolean>(false);

  const toClip = () => {
    router.push(`/sources/${source.id}/clips/new?start=${range[0]}&end=${range[1]}`);
  }

  const downloadClip = async (clip: any) => {
    console.log('Downloading clip', clip);
  }

  return (
    <div className="h-screen py-2 flex flex-col justify-between">
      <div className="flex flex-row justify-between gap-x-4">
        <div className="flex flex-col gap-y-2 w-full h-full">
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
          <div className="h-full p-4 border bg-gray-50 rounded flex flex-col gap-y-3">
            <div className="flex flex-row gap-x-4">
              <button
                className={`text-xl font-semibold ${pannel === 'clips' ? "text-blue-500" : "text-gray-400"}`}
                onClick={() => setPannel("clips")}
              >
                Clips
              </button>
              <button
                className={`text-xl font-semibold ${pannel === 'suggestions' ? "text-blue-500" : "text-gray-400"}`}
                onClick={() => setPannel("suggestions")}
              >
                Suggestions
              </button>
            </div>
            {pannel === 'clips' && (
              <div className="w-full flex flex-row justify-between flex-wrap">
                {clips.map((clip) => (
                  <button
                    key={clip.clipId}
                    onClick={() => router.push(`/sources/${source.id}/clips/${clip.clipId}`)}
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
                            downloadClip(clip).catch(() => { });
                          }}
                        >
                          <Download className="w-10 h-10 fill-gray-400" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {pannel === 'suggestions' && (
              <div className="w-full flex flex-row justify-between flex-wrap gap-y-5">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setRange([suggestion.range.start, suggestion.range.end]);
                      setRangeCreated(true);
                    }}
                    className={`
                  flex flex-row justify-between items-center cursor-pointer
                  p-2 w-full rounded bg-gray-100 border border-gray-300
               `}
                  >
                    <div className="flex flex-col gap-y-1">
                      <span className="flex justify-start text-start font-semibold">
                        {suggestion.name}
                      </span>
                      <span className="flex justify-start text-start text-gray-400">
                        {suggestion.description}
                      </span>
                      <span className="flex justify-start">
                        {toReadableTime(suggestion.range.start)} - {toReadableTime(suggestion.range.end)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center w-full bg-white rounded p-2">
          {hls ? (
            <HLSReproducer
              src={source.url!}
              timer={timer}
              startTime={0}
              height={500}
            />
          ) : (
            <MP4Reproducer
              src={source.url!}
              timer={timer}
              startTime={0}
              width={1000}
              height={500}
            />
          )}

          <div className="relative w-full flex flex-row justify-center py-4">
            <div className="flex flex-row gap-x-4">
              <button onClick={() => timer.togglePlay()}>
                {timer.playing ?
                  <Pause className="w-7 h-7 fill-none stroke-gray-700" /> :
                  <Play className="w-7 h-7 fill-none stroke-gray-700" />
                }
              </button>
              <div>{toReadableTime(timer.currentSeconds)}</div>
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
        </div>
      </div>
      <div className="flex flex-col w-full items-center">
        {timer.length && (
          <Timeline
            length={timer.length}
            imageUrl={timelineUrl}
            source={source}
            currentSeconds={timer.currentSeconds}
            setCurrentTime={(time: number) => timer.seek(time)}
          >
            {(visibleTimelineWidth: number, timelineSeconds: number, initialPosition: number, initialSeconds: number) => (
              <>
                <ClipsAndSuggestions
                  visibleTimelineWidth={visibleTimelineWidth}
                  timelineSeconds={timelineSeconds}
                  initialPosition={initialPosition}
                  initialSeconds={initialSeconds}
                  clips={clips}
                  suggestions={suggestions}
                />
                <RangeSelection
                  visibleTimelineWidth={visibleTimelineWidth}
                  timelineSeconds={timelineSeconds}
                  initialPosition={initialPosition}
                  initialSeconds={initialSeconds}
                  range={range}
                  setRange={setRange}
                  rangeCreated={rangeCreated}
                  setRangeCreated={setRangeCreated}
                />
              </>
            )}
          </Timeline>
        )}
      </div>
    </div>
  );
}
