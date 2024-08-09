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

function usePanels(inputClips: Clip[], inputSuggestions: Suggestion[]) {
  const [selection, setSelection] = useState<
    { range: [number, number] | null, created: boolean }
  >({ range: null, created: false });

  const [clips, setClips] = useState<Clip[]>(inputClips);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(inputSuggestions);

  const [selectedPanel, setSelectedPanel] = useState<{
    type: "clip" | "suggestion" | "selection" | null,
    id: string | null
    handleSide?: "left" | "right",
  }>(
    { type: null, id: null, handleSide: undefined }
  );

  function startSelection(second: number) {
    if (selectedPanel.type !== null && selectedPanel.type !== "selection") {
      setSelectedPanel({ type: null, id: null });
      return;
    }

    if (selection.range !== null || selection.created) {
      setSelectedPanel({ type: null, id: null });
      return;
    }

    setSelection({ range: [second, second], created: false });
    setSelectedPanel({ type: "selection", id: null });
  }

  function finishSelection() {
    if (selection.created || !selection.range) return;

    if (selection.range[0] === selection.range[1]) {
      deleteSelection();
      return;
    }

    setSelection({ ...selection, created: true });
  }

  function deleteSelection() {
    setSelection({ range: null, created: false });
  }

  function changePanelDuration(second: number) {
    if (selectedPanel.type === "selection") {
      if (!selection.range || (selection.created && !selectedPanel.handleSide)) return;

      if (detectCollision(second)) {
        finishSelection();
        return;
      }

      if (selectedPanel.handleSide) {
        if (selectedPanel.handleSide === "left") {
          setSelection({ range: [second, selection.range[1]], created: false });
        }
        else {
          setSelection({ range: [selection.range[0], second], created: false });
        }
      }
      else {
        if (second < selection.range[1]) {
          setSelection({ range: [second, selection.range[1]], created: false });
        }
        else {
          setSelection({ range: [selection.range[0], second], created: false });
        }
      }
    }

    else if (selectedPanel.type === "clip") {
      if (!selectedPanel.handleSide || !selectedPanel.id) return;

      const clipIndex = clips.findIndex((clip) => clip.clipId === selectedPanel.id);
      if (clipIndex === -1) return;

      const newClips = [...clips];
      const clip = newClips[clipIndex]!;

      if (selectedPanel.handleSide === "left") {
        clip.range.start = second;
      } else {
        clip.range.end = second;
      }

      setClips(newClips);
    } else if (selectedPanel.type === "suggestion") {
      if (!selectedPanel.handleSide || !selectedPanel.id) return;

      const suggestionIndex = suggestions.findIndex((suggestion) => suggestion.id === selectedPanel.id);
      if (suggestionIndex === -1) return;

      const newSuggestions = [...suggestions];
      const suggestion = newSuggestions[suggestionIndex]!;

      if (selectedPanel.handleSide === "left") {
        suggestion.range.start = second;
      } else {
        suggestion.range.end = second;
      }

      setSuggestions(newSuggestions);
    }
  }

  function detectCollision(endSec: number) {
    if (endSec <= 0) {
      return true;
    }

    if (selection.range && endSec < selection.range[0] && endSec > selection.range[1]) {
      return true;
    }

    for (const clip of clips) {
      if (endSec > clip.range.start && endSec < clip.range.end) {
        return true;
      }
    }

    for (const suggestion of suggestions) {
      if (endSec > suggestion.range.start && endSec < suggestion.range.end) {
        return true;
      }
    }

    return false;
  }

  function finishPanelDurationChange() {
    if (selectedPanel.type === "selection") {
      finishSelection();
    }

    setSelectedPanel({ ...selectedPanel, handleSide: undefined });
  }

  return {
    clips,
    suggestions,
    selection,
    setSelection,
    selectedPanel,
    setSelectedPanel,
    startSelection,
    deleteSelection,
    changePanelDuration,
    finishPanelDurationChange,
  };
}

export default function SourceEditor({
  source,
  clips: inputClips,
  suggestions: inputSuggestions,
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
  const [view, setView] = useState<"clips" | "suggestions">("clips");

  const {
    clips,
    suggestions,
    selection,
    selectedPanel,
    setSelectedPanel,
    startSelection,
    deleteSelection,
    changePanelDuration,
    finishPanelDurationChange,
  } = usePanels(inputClips, inputSuggestions);

  const toClip = () => {
    if (!selection.range) return;

    router.push(`/sources/${source.id}/clips/new?start=${selection.range[0]}&end=${selection.range[1]}`);
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
                className={`text-xl font-semibold ${view === 'clips' ? "text-blue-500" : "text-gray-400"}`}
                onClick={() => setView("clips")}
              >
                Clips
              </button>
              <button
                className={`text-xl font-semibold ${view === 'suggestions' ? "text-blue-500" : "text-gray-400"}`}
                onClick={() => setView("suggestions")}
              >
                Suggestions
              </button>
            </div>
            {view === 'clips' && (
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
            {view === 'suggestions' && (
              <div className="w-full flex flex-row justify-between flex-wrap gap-y-5">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
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
                ${false ? 'bg-blue-500' : 'bg-blue-200'}
              `}
              disabled={true}
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
            {(
              visibleTimelineWidth: number,
              timelineSeconds: number,
              initialPosition: number,
              initialSeconds: number
            ) => (
              <>
                <RangeSelection
                  suggestions={suggestions}
                  selectedPanel={selectedPanel}
                  selection={selection}
                  startSelection={startSelection}
                  deleteSelection={deleteSelection}
                  clips={clips}
                  setSelectedPanel={setSelectedPanel}
                  changePanelDuration={changePanelDuration}
                  finishPanelDurationChange={finishPanelDurationChange}
                  visibleTimelineWidth={visibleTimelineWidth}
                  timelineSeconds={timelineSeconds}
                  initialPosition={initialPosition}
                  initialSeconds={initialSeconds}
                />
              </>
            )}
          </Timeline>
        )}
      </div>
    </div>
  );
}
