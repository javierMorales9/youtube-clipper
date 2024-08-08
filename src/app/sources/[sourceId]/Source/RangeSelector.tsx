'use client';

import { useMemo } from "react";
import Cross from "../../../../../public/images/Cross.svg";
import { Clip } from "@/server/api/clips/ClipSchema";
import { Suggestion } from "@/server/api/clips/SuggestionSchema";

export default function RangeSelection({
  clips,
  suggestions,
  visibleTimelineWidth,
  timelineSeconds,
  initialSeconds,
  selection,
  startSelection,
  deleteSelection,
  selectedPanel,
  setSelectedPanel,
  changePanelDuration,
  finishPanelDurationChange,
}: {
  visibleTimelineWidth: number,
  timelineSeconds: number,
  initialPosition: number,
  initialSeconds: number,
  selection: { range: [number, number] | null, created: boolean },
  startSelection: (second: number) => void,
  deleteSelection: () => void,
  clips: Clip[],
  suggestions: Suggestion[],
  selectedPanel: {
    type: "clip" | "suggestion" | "selection" | null,
    id: string | null,
    handleSide?: "left" | "right"
  },
  setSelectedPanel: (panel: {
    type: "clip" | "suggestion" | "selection",
    id: string | null,
    handleSide?: "left" | "right"
  }) => void,
  changePanelDuration: (second: number) => void,
  finishPanelDurationChange: () => void,
}) {
  const clipPanels = useMemo(() => clips.map((clip) => ({
    name: clip.name,
    left: (clip.range.start - initialSeconds) * visibleTimelineWidth / timelineSeconds,
    width: (clip.range.end - clip.range.start) * visibleTimelineWidth / timelineSeconds,
  })), [clips, visibleTimelineWidth, timelineSeconds, initialSeconds]);

  const suggestionPanels = useMemo(() => suggestions.map((s) => ({
    name: s.name,
    left: (s.range.start - initialSeconds) * visibleTimelineWidth / timelineSeconds,
    width: (s.range.end - s.range.start) * visibleTimelineWidth / timelineSeconds,
  })), [suggestions, visibleTimelineWidth, timelineSeconds, initialSeconds]);

  const pxRange = useMemo(() => {
    const range = selection.range
    if (range === null) {
      return { left: 0, width: 0 };
    }
    return {
      left: (range[0] - initialSeconds) * visibleTimelineWidth / timelineSeconds,
      width: (range[1] - range[0]) * visibleTimelineWidth / timelineSeconds,
    };
  }, [selection, initialSeconds, visibleTimelineWidth, timelineSeconds]);

  function secondsOfPosition(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);
    const percent = clientX / bcr.width;

    return initialSeconds + percent * timelineSeconds;
  }

  return (
    <div
      className="absolute w-full h-full bottom-0"
      onMouseDown={(e) => startSelection(secondsOfPosition(e))}
      onMouseMove={(e) => changePanelDuration(secondsOfPosition(e))}
      onMouseUp={finishPanelDurationChange}
    >
      <div
        className="absolute w-full h-full"
        style={{ cursor: selectedPanel.id !== null ? "w-resize" : "default" }}
      >
        {clipPanels.map((clip, index) => (
          <div
            key={index}
            className={`
              absolute h-full z-10 overflow-hidden whitespace-nowrap text-ellipsis
              flex flex-row items-center
              px-1
            `}
            style={{
              left: clip.left,
              width: clip.width,
              backgroundColor: 'rgba(151, 202, 232, 0.7)',
            }}
          >
            <div
              className="w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedPanel({
                  type: "clip",
                  id: clips[index]!.clipId!,
                  handleSide: "left"
                });
              }}
            ></div>
            <div className="w-full p-1 h-full">
              {clip.name}
            </div>
            <div
              className="w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedPanel({
                  type: "clip",
                  id: clips[index]!.clipId!,
                  handleSide: "right"
                });
              }}
            ></div>
          </div>
        ))}
        {suggestionPanels.map((suggestion, index) => (
          <div
            key={index}
            className={`
              absolute h-full z-10 overflow-hidden whitespace-nowrap text-ellipsis
              flex flex-row items-center
              px-1
            `}
            style={{
              left: suggestion.left,
              width: suggestion.width,
              backgroundColor: 'rgba(151, 202, 232, 0.7)',
            }}
          >
            <div
              className="w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedPanel({
                  type: "suggestion",
                  id: suggestions[index]!.id,
                  handleSide: "left"
                });
              }}
            ></div>
            <div className="w-full p-1 h-full">
              {suggestion.name}
            </div>
            <div
              className="w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedPanel({
                  type: "suggestion",
                  id: suggestions[index]!.id,
                  handleSide: "right"
                });
              }}
            ></div>
          </div>
        ))}
      </div>
      <div
        className="absolute h-full z-10 flex flex-row items-center justify-between"
        style={{
          left: pxRange.left,
          width: pxRange.width,
          padding: pxRange.width > 0 ? '0 0.5rem' : '0',
          backgroundColor: 'rgba(255, 165, 0, 0.7)'
        }}
      >
        {selection.created && (
          <>
            <div
              className="w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedPanel({
                  type: "selection",
                  id: null,
                  handleSide: "left",
                });
              }}
            ></div>
            <div
              className="w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedPanel({
                  type: "selection",
                  id: null,
                  handleSide: "right",
                });
              }}
            ></div>

            <span
              className="absolute right-0 top-0 text-black cursor-pointer"
              onClick={deleteSelection}
            >
              <Cross className="w-6 h-6 fill-black" />
            </span>
          </>
        )}
      </div>
    </div>);
}

