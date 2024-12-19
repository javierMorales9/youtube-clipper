'use client';

import { useMemo } from "react";
import Cross from "../../../../../public/images/Cross.svg";
import { ClipType } from "@/server/entities/clip/domain/Clip";
import { SuggestionType } from "@/server/entities/suggestion/domain/Suggestion";

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
  setPanel,
  addHandle,
  changePanelDuration,
  finishPanelDurationChange,
}: {
  visibleTimelineWidth: number,
  timelineSeconds: number,
  initialPosition: number,
  initialSeconds: number,
  selection: { range: { start: number, end: number } | null, created: boolean },
  startSelection: (second: number) => void,
  deleteSelection: () => void,
  clips: ClipType[],
  suggestions: SuggestionType[],
  selectedPanel: {
    type: "clip" | "suggestion" | "selection" | null,
    id: string | null,
    handleSide?: "left" | "right"
  },
  setPanel: (type: "clip" | "suggestion" | "selection", id?: string) => void,
  addHandle: (side: "left" | "right") => void,
  changePanelDuration: (second: number) => void,
  finishPanelDurationChange: () => void,
}) {
  const clipPanels = useMemo(
    () => clips.map((clip) => ({ name: clip.name, ...panelDimensions(clip.range), })),
    [clips, visibleTimelineWidth, timelineSeconds, initialSeconds]
  );

  const suggestionPanels = useMemo(
    () => suggestions.map((s) => ({ name: s.name, ...panelDimensions(s.range), })),
    [suggestions, visibleTimelineWidth, timelineSeconds, initialSeconds]
  );

  const selectionPanel = useMemo(() => {
    return panelDimensions(selection.range);
  }, [selection, initialSeconds, visibleTimelineWidth, timelineSeconds]);

  function panelDimensions(range?: { start: number, end: number } | null) {
    if (!range) {
      return { left: 0, width: 0 };
    }

    return {
      left: (range.start - initialSeconds) * visibleTimelineWidth / timelineSeconds,
      width: (range.end - range.start) * visibleTimelineWidth / timelineSeconds,
    }
  }

  function secondsOfPosition(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);
    const percent = clientX / bcr.width;

    return initialSeconds + percent * timelineSeconds;
  }

  function Handles() {
    return (
      <>
        <div
          className="absolute top-1/4 left-[-4px] w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            addHandle("left");
          }}
        ></div>
        <div
          className="absolute top-1/4 right-[-4px] w-2 h-1/2 rounded bg-gray-500 cursor-w-resize"
          onMouseDown={(e) => {
            e.stopPropagation();
            addHandle("right");
          }}
        ></div>
      </>

    );
  }

  return (
    <div
      className="absolute w-full h-full bottom-0"
      onMouseDown={(e) => startSelection(secondsOfPosition(e))}
      onMouseMove={(e) => changePanelDuration(secondsOfPosition(e))}
      onMouseUp={finishPanelDurationChange}
      onMouseLeave={finishPanelDurationChange}
    >
      <div
        className="absolute w-full h-full"
        style={{ cursor: selectedPanel.handleSide ? "w-resize" : "default" }}
      >
        {clipPanels.map((clip, index) => (
          <div
            key={index}
            className={`
              absolute h-full z-10
              flex flex-row items-center
              px-1 cursor-pointer
            `}
            style={{
              left: clip.left,
              width: clip.width,
              backgroundColor: 'rgba(122, 237, 59, 0.7)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPanel("clip", clips[index]!.id);
            }}
          >
            {/*selectedPanel.id === clips[index]!.id && <Handles />*/}
            <div className="w-full p-1 h-full overflow-hidden whitespace-nowrap text-ellipsis">
              {clip.name}
            </div>
          </div>
        ))}
        {suggestionPanels.map((suggestion, index) => (
          <div
            key={index}
            className={`
              absolute h-full z-10
              flex flex-row items-center
              px-1 cursor-pointer
            `}
            style={{
              left: suggestion.left,
              width: suggestion.width,
              backgroundColor: 'rgba(151, 202, 232, 0.7)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setPanel("suggestion", suggestions[index]!.id);
            }}
          >
            {selectedPanel.id === suggestions[index]!.id && <Handles />}
            <div className="w-full p-1 h-full overflow-hidden whitespace-nowrap text-ellipsis">
              {suggestion.name}
            </div>
          </div>
        ))}
      </div>
      <div
        className="absolute h-full z-10 "
        style={{
          left: selectionPanel.left,
          width: selectionPanel.width,
          padding: selectionPanel.width > 0 ? '0 0.5rem' : '0',
          backgroundColor: 'rgba(255, 165, 0, 0.7)'
        }}
      >
        {selection.created && (
          <div
            className="w-full h-full flex flex-row items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setPanel("selection");
            }}
          >
            {selectedPanel.type === "selection" && <Handles />}

            <span
              className="absolute right-0 top-0 text-black cursor-pointer"
              onClick={deleteSelection}
            >
              <Cross className="w-6 h-6 fill-black" />
            </span>
          </div>
        )}
      </div>
    </div>);
}

