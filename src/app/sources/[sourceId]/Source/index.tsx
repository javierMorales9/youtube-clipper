'use client';

import Timeline from "@/app/sources/[sourceId]/Timeline";
import { useTimer } from "../useTimer";
import RangeSelection from "./RangeSelector";
import { useEffect, useState } from "react";
import Link from "next/link";
import Back from "../../../../../public/images/Back.svg";
import Play from "../../../../../public/images/MaterialSymbolsPlayArrow.svg";
import Pause from "../../../../../public/images/Pause.svg";
import HLSReproducer from "./HLSReproducer";
import { SourceType } from "@/server/entities/source/domain/Source";
import { useRouter } from "next/navigation";
import { toReadableTime } from "@/app/utils";
import Download from "../../../../../public/images/Download.svg";
import Loading from "../../../../../public/images/Loading.svg";
import { ClipType } from "@/server/entities/clip/domain/Clip";
import { SuggestionType } from "@/server/entities/suggestion/domain/Suggestion";
import MP4Reproducer from "./MP4Reproducer";
import { usePanels } from "./usePanels";

export default function SourceEditor({
  source,
  clips: inputClips,
  suggestions: inputSuggestions,
  timelineUrl,
  hls,
}: {
  source: SourceType,
  clips: ClipType[],
  suggestions: SuggestionType[],
  timelineUrl: string,
  hls: boolean,
}) {
  const timer = useTimer(source.duration || undefined);

  const {
    clips,
    suggestions,
    selection,
    selectedPanel,
    setPanel,
    addHandle,
    startSelection,
    deleteSelection,
    changePanelDuration,
    finishPanelDurationChange,
  } = usePanels(inputClips, inputSuggestions);

  useEffect(() => {
    timer.restrict(selectedPanel.range);
  }, [selectedPanel]);

  return (
    <div className="py-2 flex flex-col justify-between">
      <div className="flex flex-row justify-between gap-x-4">
        <Menu />
        <div className="flex flex-col items-center w-full bg-white rounded p-2">
          {hls ? (
            <HLSReproducer
              src={source.url!}
              timer={timer}
              startTime={0}
              height={400}
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
              <div>
                {toReadableTime(timer.currentSeconds)}
                {timer.length && " / " + toReadableTime(timer.length)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col w-full items-center">
        {timer.length && (
          <Timeline
            length={timer.length}
            currentSeconds={timer.currentSeconds}
            setCurrentTime={(time: number) => timer.seek(time)}
            imageUrl={timelineUrl}
            source={source}
          >
            {(
              secondsOfClick: (value: number) => number,
              left: (startSeconds: number) => number,
              width: (startSeconds: number, endSeconds: number) => number,
              reference: number,
            ) => (
              <>
                <RangeSelection
                  suggestions={suggestions}
                  selectedPanel={selectedPanel}
                  selection={selection}
                  startSelection={startSelection}
                  deleteSelection={deleteSelection}
                  clips={clips}
                  setPanel={setPanel}
                  addHandle={addHandle}
                  changePanelDuration={changePanelDuration}
                  finishPanelDurationChange={finishPanelDurationChange}
                  secondsOfClick={secondsOfClick}
                  left={left}
                  width={width}
                  reference={reference}
                />
              </>
            )}
          </Timeline>
        )}
      </div>
    </div>
  );

  function Menu() {
    const router = useRouter();
    const [view, setView] = useState<"clips" | "suggestions">("suggestions");
    const [redirectingToClip, setRedirectingToClip] = useState(false);

    const toEditor = () => {
      if (!selectedPanel.range) return;

      if (selectedPanel.type === 'clip') {
        router.push(`/sources/${source.id}/clips/${selectedPanel.id}/`);
      }
      else {
        router.push(`/sources/${source.id}/clips/new?start=${selectedPanel.range.start}&end=${selectedPanel.range.end}`);
      }

      setRedirectingToClip(true);
    }

    const downloadClip = async (clip: any) => {
      console.log('Downloading clip', clip);
    }

    return (
      <div className="w-full flex flex-col gap-y-2">
        <div className="p-4 border rounded flex flex-col gap-y-3 bg-white max-h-[500px] ">
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
          <div className="flex flex-row gap-x-4">
            <button
              className={`text-xl font-semibold ${view === 'suggestions' ? "text-blue-500" : "text-gray-400"}`}
              onClick={() => setView("suggestions")}
            >
              Suggestions
            </button>
            <button
              className={`text-xl font-semibold ${view === 'clips' ? "text-blue-500" : "text-gray-400"}`}
              onClick={() => setView("clips")}
            >
              Clips
            </button>
            <div className="w-full flex justify-end">
              <button
                onClick={toEditor}
                className={`
                text-white px-4 py-2 rounded-lg
                ${selectedPanel.type !== null ? 'bg-blue-500' : 'bg-blue-200'}
              `}
                disabled={selectedPanel.type === null || redirectingToClip}
              >
                {redirectingToClip ? (
                  <Loading className="w-6 h-6 fill-white" />
                ) : (
                  <>
                    {selectedPanel.type === 'clip' ? 'Edit Clip' : 'Create Clip'}
                  </>
                )}
              </button>
            </div>
          </div>

          {view === 'suggestions' && (
            <div className="w-full overflow-y-scroll flex flex-row justify-between flex-wrap gap-y-5">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  className={`
                      flex flex-row justify-between items-center cursor-pointer
                      p-2 w-full rounded border 
                      ${(selectedPanel.id !== null && selectedPanel.id === suggestion.id) ?
                      'bg-blue-100 border-blue-300'
                      : 'bg-gray-100 border-gray-300'
                    }
                    `}
                  onClick={() => setPanel("suggestion", suggestion.id)}
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
          {view === 'clips' && (
            <div className="w-full flex flex-row justify-between flex-wrap">
              {clips.map((clip) => (
                <button
                  key={clip.id}
                  className={`
                      flex flex-row justify-between items-center cursor-pointer
                      p-2 w-full rounded border 
                      ${(selectedPanel.id !== null && selectedPanel.id === clip.id) ?
                      'bg-blue-100 border-blue-300'
                      : 'bg-gray-100 border-gray-300'
                    }
                    `}
                  onClick={() => setPanel("clip", clip.id)}
                //disabled={clip.processing}
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
        </div>
      </div>
    );
  }
}
