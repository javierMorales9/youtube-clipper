'use client';

import { useMemo } from "react";
import Cross from "../../../../../public/images/Cross.svg";
import { ClipType } from "@/server/entities/clip/domain/Clip";
import { SuggestionType } from "@/server/entities/suggestion/domain/Suggestion";

export default function Blocks({
  clips,
  suggestions,
  selection,
  startSelection,
  deleteSelection,
  selectedBlock,
  setBlock,
  addHandle,
  changeBlockDuration,
  finishBlockDurationChange,
  secondsOfClick,
  left,
  width,
  cursor,
}: {
  secondsOfClick: (value: number) => number,
  left: (startSeconds: number) => number,
  width: (startSeconds: number, endSeconds: number) => number,
  selection: { range: { start: number, end: number } | null, created: boolean },
  startSelection: (second: number) => void,
  deleteSelection: () => void,
  clips: ClipType[],
  suggestions: SuggestionType[],
  selectedBlock: {
    type: "clip" | "suggestion" | "selection" | null,
    id: string | null,
    handleSide?: "left" | "right"
  },
  setBlock: (type: "clip" | "suggestion" | "selection", id?: string) => void,
  addHandle: (side: "left" | "right") => void,
  changeBlockDuration: (second: number) => void,
  finishBlockDurationChange: () => void,
  cursor: number,
}) {
  const clipBlocks = useMemo(
    () => clips.map((clip) => ({ name: clip.name, ...blockDimensions(clip.range), })),
    [clips, cursor]
  );

  const suggestionBlocks = useMemo(
    () => suggestions.map((s) => ({ name: s.name, ...blockDimensions(s.range), })),
    [suggestions, cursor]
  );

  const selectionBlock = useMemo(() => {
    return blockDimensions(selection.range);
  }, [selection, cursor]);

  function blockDimensions(range?: { start: number, end: number } | null) {
    if (!range) {
      return { left: 0, width: 0 };
    }

    return {
      left: left(range.start),
      width: width(range.start, range.end),
    }
  }

  function secondsOfPosition(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);

    return secondsOfClick(clientX);
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
      onMouseMove={(e) => changeBlockDuration(secondsOfPosition(e))}
      onMouseUp={finishBlockDurationChange}
      onMouseLeave={finishBlockDurationChange}
    >
      <div
        className="absolute w-full h-full"
        style={{ cursor: selectedBlock.handleSide ? "w-resize" : "default" }}
      >
        {clipBlocks.map((clip, index) => (
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
              setBlock("clip", clips[index]!.id);
            }}
          >
            {/*selectedBlock.id === clips[index]!.id && <Handles />*/}
            <div className="w-full p-1 h-full overflow-hidden whitespace-nowrap text-ellipsis">
              {clip.name}
            </div>
          </div>
        ))}
        {suggestionBlocks.map((suggestion, index) => (
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
              setBlock("suggestion", suggestions[index]!.id);
            }}
          >
            {selectedBlock.id === suggestions[index]!.id && <Handles />}
            <div className="w-full p-1 h-full overflow-hidden whitespace-nowrap text-ellipsis">
              {suggestion.name}
            </div>
          </div>
        ))}
      </div>
      <div
        className="absolute h-full z-10 "
        style={{
          left: selectionBlock.left,
          width: selectionBlock.width,
          padding: selectionBlock.width > 0 ? '0 0.5rem' : '0',
          backgroundColor: 'rgba(255, 165, 0, 0.7)'
        }}
      >
        {selection.created && (
          <div
            className="w-full h-full flex flex-row items-center justify-between cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setBlock("selection");
            }}
          >
            {selectedBlock.type === "selection" && <Handles />}

            <span
              className="absolute right-0 top-0 text-black cursor-pointer"
              onClick={deleteSelection}
            >
              <Cross className="w-6 h-6 fill-black" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
