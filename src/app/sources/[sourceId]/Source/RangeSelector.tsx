'use client';

import { useMemo, useEffect, useState } from "react";
import Cross from "../../../../../public/images/Cross.svg";
import { Clip } from "@/server/api/clips/ClipSchema";
import { Suggestion } from "@/server/api/clips/SuggestionSchema";

export default function RangeSelection({
  visibleTimelineWidth,
  timelineSeconds,
  initialSeconds,
  initialPosition,
  range,
  setRange,
  rangeCreated,
  setRangeCreated,
  clips,
  suggestions,
}: {
  visibleTimelineWidth: number,
  timelineSeconds: number,
  initialPosition: number,
  initialSeconds: number,
  range: [number, number],
  setRange: (range: [number, number]) => void,
  rangeCreated: boolean,
  setRangeCreated: (created: boolean) => void,
  clips: Clip[],
  suggestions: Suggestion[],
}) {
  const clipPanels = useMemo(() => clips.map((clip, index) => ({
    name: clip.name,
    left: visibleTimelineWidth * (clip.range.start - initialSeconds) / timelineSeconds,
    width: visibleTimelineWidth * (clip.range.end - clip.range.start) / timelineSeconds,
  })), [clips, visibleTimelineWidth, timelineSeconds, initialSeconds]);

  const suggestionPanels = useMemo(() => suggestions.map((s, index) => ({
    name: s.name,
    left: visibleTimelineWidth * (s.range.start - initialSeconds) / timelineSeconds,
    width: visibleTimelineWidth * (s.range.end - s.range.start) / timelineSeconds,
  })), [suggestions, visibleTimelineWidth, timelineSeconds, initialSeconds]);

  const [selectedElement, setSelectedElement] = useState<{ type: "clip" | "suggestion", id: string | null }>(
    { type: "clip", id: null }
  );

  const [creatingRange, setCreatingRage] = useState(false);
  const [pxRange, setPxRange] = useState<[number, number]>([0, 0]);

  function handleMouseDown(percent: number) {
    if (rangeCreated) return;

    const startSec = initialSeconds + percent * timelineSeconds;
    setRange([startSec, startSec]);

    const pxStart = initialPosition + visibleTimelineWidth * percent;
    setPxRange([pxStart, pxStart]);

    setCreatingRage(true);
  }

  function handleMouseMove(percent: number) {
    if (rangeCreated || !creatingRange) return;

    const endSec = initialSeconds + percent * timelineSeconds;

    for (const clip of clips) {
      if (endSec > clip.range.start && endSec < clip.range.end) {
        handleMouseUp();
        return;
      }
    }

    for (const suggestion of suggestions) {
      if (endSec > suggestion.range.start && endSec < suggestion.range.end) {
        handleMouseUp();
        return;
      }
    }

    if (endSec < range[1]) {
      setRange([endSec, range[1]]);

      const pxEnd = initialPosition + visibleTimelineWidth * percent;
      setPxRange([pxEnd, pxRange[1]]);
    }
    else {
      setRange([range[0], endSec]);

      const pxEnd = initialPosition + visibleTimelineWidth * percent;
      setPxRange([pxRange[0], pxEnd]);
    }
  }

  function handleMouseUp() {
    if (rangeCreated) return;

    if (range[0] === range[1]) {
      setRange([0, 0]);
      setPxRange([0, 0]);
      setCreatingRage(false);
      setRangeCreated(false);
      return;
    }

    setCreatingRage(false);
    setRangeCreated(true);
  }

  function deleteRange(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setRange([0, 0]);
    setPxRange([0, 0]);
    setRangeCreated(false);
  }

  function percent(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);
    return clientX / bcr.width;
  }

  useEffect(() => {
    if (rangeCreated) {
      setPxRange([
        initialPosition + visibleTimelineWidth * (range[0] - initialSeconds) / timelineSeconds,
        initialPosition + visibleTimelineWidth * (range[1] - initialSeconds) / timelineSeconds,
      ]);
    }
  }, [range]);

  return (
    <div
      className="absolute w-full h-full bottom-0"
      onMouseDown={(e) => {
        e.preventDefault();
        handleMouseDown(percent(e));
      }}
      onMouseMove={(e) => {
        e.preventDefault();
        handleMouseMove(percent(e));
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        handleMouseUp();
      }}
    >
      <div
        className="absolute w-full h-full"
        onMouseMove={(e) => {
          if (selectedElement.id == null) return;

          e.preventDefault();
          e.stopPropagation();

          console.log("moving");
        }}
        onMouseUp={(e) => {
          if (selectedElement.id == null) return;

          e.preventDefault();
          e.stopPropagation();

          setSelectedElement({ type: selectedElement.type, id: null });
          console.log("releasing");
        }}
      >
        {clipPanels.map((clip, index) => (
          <div
            key={index}
            className="absolute h-full z-10"
            style={{
              left: clip.left,
              width: clip.width,
            }}
          >
            <div
              className="absolute top-0 w-full h-full"
              style={{ backgroundColor: 'rgba(185, 232, 151, 0.7)' }}
            >
              {clip.width > 100 && (
                <span>
                  {clip.name}
                </span>
              )}
            </div>
          </div>
        ))}
        {suggestionPanels.map((suggestion, index) => (
          <div
            key={index}
            className="absolute h-full z-10 overflow-hidden whitespace-nowrap text-ellipsis"
            style={{
              left: suggestion.left,
              width: suggestion.width,
              backgroundColor: 'rgba(151, 202, 232, 0.7)',
            }}
          >
            <div
              className="w-3 h-1/2 rounded bg-black cursor-pointer"
              onMouseDown={(e) => {
                e.preventDefault();
                setSelectedElement({ type: "suggestion", id: suggestions[index]!.id });
              }}
            ></div>
            <span className="">
              {suggestion.name}
            </span>
          </div>
        ))}
      </div>
      <div
        className="absolute h-full z-10"
        style={{
          left: pxRange[0] - initialPosition,
          width: pxRange[1] - pxRange[0],
        }}
      >
        <div
          className="absolute top-0 w-full h-full"
          style={{ backgroundColor: 'rgba(255, 165, 0, 0.7)' }}
        ></div>
        {rangeCreated && (
          <span
            className="absolute right-0 top-0 text-black cursor-pointer"
            onClick={deleteRange}
          >
            <Cross className="w-6 h-6 fill-black" />
          </span>
        )}
      </div>
    </div>);
}

