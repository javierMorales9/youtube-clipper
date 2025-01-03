'use client';

import Timeline from "../../Timeline";
import { Timer } from "../../useTimer";
import { useFormContext } from "react-hook-form";
import { SourceType } from "@/server/entities/source/domain/Source";
import { Clip, SectionFront } from "../Clip";
import Play from "../../../../../../public/images/MaterialSymbolsPlayArrow.svg";
import Split from "../../../../../../public/images/Split.svg";
import Trash from "../../../../../../public/images/Trash.svg";
import Pause from "../../../../../../public/images/Pause.svg";
import { toReadableTime } from "@/app/utils";
import { useMemo } from "react";

export function TimelineWrapper({
  source,
  timer,
  togglePreview,
  start,
  selectedSection,
  timelineUrl,
  setSelectedSection,
  divideSection,
  deleteSection,
}: {
  source: SourceType,
  timer: Timer,
  togglePreview: () => void,
  start: number,
  timelineUrl: string,
  selectedSection: number,
  setSelectedSection: (start: number) => void,
  divideSection: () => void,
  deleteSection: () => void,
}) {

  const form = useFormContext<Clip>();

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
              reference: number,
            ) => (
              <SectionSelector
                secondsOfClick={secondsOfClick}
                left={left}
                width={width}
                reference={reference}
                sections={form.watch('sections')}
                selectedSection={selectedSection}
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
  reference,
  sections,
  selectedSection,
  setSelectedSection,
}: {
  secondsOfClick: (value: number) => number,
  left: (startSeconds: number) => number,
  width: (startSeconds: number, endSeconds: number) => number,
  reference: number,
  sections: Clip['sections']
  selectedSection: number,
  setSelectedSection: (start: number) => void,
}) {
  return (
    <div className="absolute w-full h-full">
      {sections.map((section, i) => (
        <Section
          key={i}
          section={section}
          selected={selectedSection === i}
          onClick={() => setSelectedSection(i)}
        />
      ))}
    </div>
  );

  function Section({
    section,
    selected,
    onClick,
  }: {
    section: SectionFront,
    selected: boolean,
    onClick: () => void,
  }) {
    const leftVal = useMemo(
      () => left(section.start),
      [section.start, reference]
    );

    const widthVal = useMemo(
      () => width(section.start, section.end),
      [section.start, section.end, reference]
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
  timer,
  divideSection,
  deleteSection,
  zoomBar,
  showPreview,
}: {
  timer: Timer,
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
            <button onClick={() => timer.togglePlay()}>
              {timer.playing ?
                <Pause className="w-7 h-7 fill-none stroke-gray-700" /> :
                <Play className="w-7 h-7 fill-none stroke-gray-700" />
              }
            </button>
            <div>{toReadableTime(timer.currentSeconds)}</div>
          </div>
        </div>
        <button onClick={showPreview}>Preview</button>
      </div>
    </>
  );
}
