'use client';

import { useMemo } from "react";
import { Clip } from "@/server/api/clips/ClipSchema";
import { Suggestion } from "@/server/api/clips/SuggestionSchema";

export default function ClipsAndSuggestions({
  visibleTimelineWidth,
  timelineSeconds,
  initialSeconds,
  clips,
  suggestions,
}: {
  visibleTimelineWidth: number,
  timelineSeconds: number,
  initialPosition: number,
  initialSeconds: number,
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

  return (
    <div className="absolute w-full h-full bottom-0">
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
          className="absolute h-full z-10"
          style={{
            left: suggestion.left,
            width: suggestion.width,
          }}
        >
          <div
            className="absolute top-0 w-full h-full overflow-hidden whitespace-nowrap text-ellipsis"
            style={{ backgroundColor: 'rgba(151, 202, 232, 0.7)' }}
          >
            <span className="">
              {suggestion.name}
            </span>
          </div>
        </div>
      ))}
    </div>);
}


