'use client';

import Timeline from "@/app/_components/Timeline";
import { Timer } from "@/app/_components/useTimer";
import { useFormContext } from "react-hook-form";
import { SourceType } from "@/server/entities/source/domain/Source";
import Split from "../../../../public/images/Split.svg";
import Trash from "../../../../public/images/Trash.svg";
import { useMemo } from "react";
import Play from "../../../../public/images/MaterialSymbolsPlayArrow.svg";
import Pause from "../../../../public/images/Pause.svg";
import { toReadableTime } from "@/app/utils";
import { Clip, ClipType, SectionType } from "@/server/entities/clip/domain/Clip";

export function TimelineWrapper({
  source,
  timer,
  togglePreview,
  start,
  duration,
  selectedSectionIndex,
  timelineUrl,
  setSelectedSection,
  divideSection,
  deleteSection,
}: {
  source: SourceType,
  timer: Timer,
  togglePreview: () => void,
  start: number,
  duration: number,
  timelineUrl: string,
  selectedSectionIndex: number,
  setSelectedSection: (start: number) => void,
  divideSection: () => void,
  deleteSection: () => void,
}) {

  const form = useFormContext<ClipType>();

  return (
    <div className="flex flex-col items-center w-full">
      {timer.length && (
        <div className="flex flex-col w-full items-center">
          <Timeline
            length={timer.length}
            currentSeconds={timer.currentSeconds}
            setCurrentTime={(time: number) => timer.seek(time)}
            imageUrl={timelineUrl}
            source={source}
            offset={start}
            controls={(zoomBar) => (
              <div className="w-full flex flex-row gap-x-10 justify-center">
                <Controls
                  timer={timer}
                  duration={duration}
                  divideSection={divideSection}
                  deleteSection={deleteSection}
                  zoomBar={zoomBar}
                  showPreview={togglePreview}
                />
              </div>
            )}
          >
            {(
              secondsOfClick: (value: number) => number,
              left: (startSeconds: number) => number,
              width: (startSeconds: number, endSeconds: number) => number,
              cursor: number,
            ) => (
              <SectionSelector
                secondsOfClick={secondsOfClick}
                left={left}
                width={width}
                cursor={cursor}
                sections={form.watch('sections')}
                selectedSectionIndex={selectedSectionIndex}
                setSelectedSection={setSelectedSection}
              />
            )}
          </Timeline>
        </div>
      )}
    </div>
  );
}

function SectionSelector({
  left,
  width,
  cursor,
  sections,
  selectedSectionIndex,
  setSelectedSection,
}: {
  secondsOfClick: (value: number) => number,
  left: (startSeconds: number) => number,
  width: (startSeconds: number, endSeconds: number) => number,
  cursor: number,
  sections: Clip['sections']
  selectedSectionIndex: number,
  setSelectedSection: (start: number) => void,
}) {
  return (
    <div className="absolute w-full h-full">
      {sections.map((section, i) => (
        <Section
          key={i}
          section={section}
          selected={selectedSectionIndex === i}
          onClick={() => {setSelectedSection(i)}}
        />
      ))}
    </div>
  );

  function Section({
    section,
    selected,
    onClick,
  }: {
    section: SectionType,
    selected: boolean,
    onClick: () => void,
  }) {
    const leftVal = useMemo(
      () => left(section.start),
      [section.start, cursor]
    );

    const widthVal = useMemo(
      () => width(section.start, section.end),
      [section.start, section.end, cursor]
    );

    return (
      <div
        className={`
          absolute h-full border-2 border-gray-400
          ${selected && 'bg-gray-200 opacity-50'}
        `}
        style={{
          left: leftVal,
          width: widthVal,
        }}
        onClick={onClick}
      >
      </div>
    );
  }
}

function Controls({
  timer: {
    togglePlay,
    playing,
    currentSeconds
  },
  duration,
  divideSection,
  deleteSection,
  zoomBar,
  showPreview,
}: {
  timer: Timer,
  duration: number,
  divideSection: () => void,
  deleteSection: () => void
  zoomBar?: JSX.Element,
  showPreview?: () => void
}) {

  return (
    <>
      <div className="relative p-4 flex flex-row justify-between w-full gap-x-4">
        <div className="flex flex-row justify-center items-center gap-x-4">
          {zoomBar}
          <button onClick={divideSection}>
            <Split className="w-7 h-7 " />
          </button>
          <button onClick={deleteSection}>
            <Trash className="w-7 h-7" />
          </button>
        </div>
        <div className="flex flex-row items-center gap-x-4">
          <div className="flex flex-row gap-x-2">
            <button onClick={() => { togglePlay() }}>
              {playing ?
                <Pause className="w-7 h-7 fill-none stroke-gray-700" /> :
                <Play className="w-7 h-7 fill-none stroke-gray-700" />
              }
            </button>
            <div>{toReadableTime(currentSeconds)} / {toReadableTime(duration)}</div>
          </div>
        </div>
        <button onClick={showPreview}>Preview</button>
      </div>
    </>
  );
}
