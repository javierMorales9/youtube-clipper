'use client';
import { toReadableTime } from '@/app/utils';
import { SourceType } from '@/server/entities/source/domain/Source';
import { useState, MouseEvent, WheelEvent, useRef, useEffect, useMemo, useCallback } from 'react';

const NUMBER_OF_MARKS = 6;
const MIN_ZOOM = 1;
const MAX_ZOOM = 10;
const DEFAULT_ZOOM = MIN_ZOOM;

export default function Timeline({
  length,
  currentSeconds,
  setCurrentTime,
  imageUrl,
  source,
  offset = 0,
  controls,
  children,
}: {
  length: number,
  currentSeconds: number,
  setCurrentTime: (time: number) => void,
  imageUrl: string,
  source: SourceType,
  offset?: number,
  controls?: (ZoomBar: JSX.Element) => JSX.Element,
  children?: (
    secondsOfClick: (value: number) => number,
    left: (startSeconds: number) => number,
    width: (startSeconds: number, endSeconds: number) => number,
    reference: number,
  ) => JSX.Element,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [visibleTimelineWidth, setVisibleTimelineWidth] = useState(0);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setVisibleTimelineWidth(container.clientWidth);
  }, [containerRef.current]);


  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [scrollValue, setScrollValue] = useState(0);

  const {
    reference,
    sections,
    secondsOfClick,
    left,
    width,
  } = useSections({
    visibleTimelineWidth,
    currentSeconds: currentSeconds,
    zoom,
    scrollValue,
    length: length,
  });

  function changeZoom(value: number) {
    if (value < MIN_ZOOM || value > MAX_ZOOM) return;

    setZoom(value);
  }

  function scroll(e: WheelEvent<HTMLDivElement>) {
    //Depending if the user is scrolling with the mouse wheel or the trackpad
    //we get the deltaY or deltaX value
    const value = Math.abs(e.deltaY) !== 0 ? e.deltaY : e.deltaX;
    setScrollValue(value);
  }

  function handleTimelineClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);

    setCurrentTime(secondsOfClick(clientX));
  }

  return (
    <>
      <div
        id="timeline"
        ref={containerRef}
        className="w-full flex flex-col items-center gap-y-4"
      >
        {visibleTimelineWidth !== 0 && length !== 0 && (
          <>
            <Controls
              changeZoom={changeZoom}
              zoom={zoom}
              length={length}
              controls={controls}
            />
            <div
              className="flex items-start overflow-x-hidden no-scrollbar"
              style={{
                width: visibleTimelineWidth + 'px',
              }}
            >
              <div
                className="flex flex-col justify-end relative"
                onClick={handleTimelineClick}
                onWheel={scroll}
              >
                <Reference
                  reference={reference}
                />
                <div className="flex flex-col justify-start items-start">
                  <TimelineMarks
                    sections={sections}
                    visibleTimelineWidth={visibleTimelineWidth}
                  />
                  <div className="relative flex flex-row items-start">
                    {children && children(
                      secondsOfClick,
                      left,
                      width,
                      reference,
                    )}
                    <Images
                      sections={sections}
                      imageUrl={imageUrl}
                      offset={offset}
                      visibleTimelineWidth={visibleTimelineWidth}
                      source={source}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

type Section = {
  width: number,
  time?: string,
  second: number,
  first?: boolean,
  last?: boolean,
};
function useSections({
  visibleTimelineWidth,
  currentSeconds,
  zoom,
  scrollValue,
  length,
}: {
  visibleTimelineWidth: number,
  currentSeconds: number,
  zoom: number,
  scrollValue: number,
  length: number,
}) {
  const [initialPosition, setInitialPosition] = useState(0);

  useEffect(() => {
    //We need to update the initial position so that the current time mark 
    //is in the middle of the visible timeline
    //If we don't do this, the timeline will be calculated from the initial position
    //prior to the zoom change, which can be very far from the current visible timeline
    let newInitialPosition = pxFromSec(currentSeconds) - visibleTimelineWidth / 2;
    newInitialPosition = newInitialPosition < 0 ? 0 : newInitialPosition;

    setInitialPosition(newInitialPosition);
  }, [zoom]);

  useEffect(() => {
    let newPosition = initialPosition + scrollValue;

    if (newPosition < 0) newPosition = 0;

    if (newPosition > timelineWidth(zoom) - visibleTimelineWidth) {
      newPosition = timelineWidth(zoom) - visibleTimelineWidth;
    }

    setInitialPosition(newPosition);
  }, [scrollValue]);

  const reference = useMemo(
    () => pxFromSec(currentSeconds) - initialPosition,
    [initialPosition, currentSeconds, length, zoom]
  );

  const sections = useMemo<Section[]>(
    () => {
      const markWidth = visibleTimelineWidth / NUMBER_OF_MARKS;
      const leftMark = Math.abs(initialPosition) / timelineWidth(zoom) * marks(zoom);

      const offset = leftMark % 1;

      const result: Section[] = [];

      const complete = Math.floor(offset * 100) === 0;
      result.push({
        width: complete ? markWidth : markWidth * (1 - offset),
        time: toReadableTime(Math.floor(leftMark) * markSecInc(zoom)),
        second: Math.floor(Math.floor(leftMark) * markSecInc(zoom)),
        first: true,
      });

      for (let i = 1; i < NUMBER_OF_MARKS; i++) {
        result.push({
          width: markWidth,
          time: toReadableTime((i + Math.floor(leftMark)) * markSecInc(zoom)),
          second: Math.floor((i + Math.floor(leftMark)) * markSecInc(zoom)),
        });
      }

      result.push({
        width: markWidth * (offset),
        time: toReadableTime((Math.floor(leftMark) + NUMBER_OF_MARKS) * markSecInc(zoom)),
        second: Math.floor((Math.floor(leftMark) + NUMBER_OF_MARKS) * markSecInc(zoom)),
        last: true,
      });

      return result;
    },
    [visibleTimelineWidth, initialPosition, zoom, length, scrollValue]
  );

  function marks(zoom: number) {
    const gap = 1;
    const minMarks = NUMBER_OF_MARKS;
    const maxMarks = Math.floor(length / gap);

    //We use an exponential function to calculate the number of marks
    return minMarks * Math.pow(maxMarks / minMarks, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM));
  }

  function markSecInc(zoom: number) {
    return length / marks(zoom);
  }

  function timelineWidth(zoom: number) {
    return visibleTimelineWidth * marks(zoom) / NUMBER_OF_MARKS;
  }

  function pxFromSec(seconds: number) {
    const pxPerSec = timelineWidth(zoom) / length;

    return seconds * pxPerSec;
  }

  function secFromPx(px: number) {
    const pxPerSec = timelineWidth(zoom) / length;

    return px / pxPerSec;
  }

  function secondsOfClick(value: number) {
    return secFromPx(initialPosition + value);
  }

  function left(startSeconds: number) {
    return pxFromSec(startSeconds - secFromPx(initialPosition));
  }

  function width(startSeconds: number, endSeconds: number) {
    return pxFromSec(endSeconds - startSeconds);
  }

  return {
    reference,
    sections,
    secondsOfClick,
    left,
    width,
  };
}

function Controls({
  changeZoom,
  zoom,
  length,
  controls,
}: {
  changeZoom: (value: number) => void,
  zoom: number,
  length: number,
  controls?: (ZoomBar: JSX.Element) => JSX.Element,
}) {
  function ZoomBar() {
    return (
      <>
        {length && Math.floor(length / NUMBER_OF_MARKS - 1) > 1 && (
          <div className="w-full flex flex-row justify-start gap-x-2">
            <span
              className="text-lg p-2 border border-gray-300 cursor-pointer"
              onClick={() => changeZoom(zoom - 1)}
            >
              -
            </span>
            <input
              type="range"
              min={1}
              value={zoom}
              max={MAX_ZOOM}
              step={1}
              onChange={(e) => changeZoom(parseInt(e.target.value))}
            />
            <span
              className="text-lg p-2 border border-gray-300 cursor-pointer"
              onClick={() => changeZoom(zoom + 1)}
            >
              +
            </span>
          </div>
        )}
      </>
    );
  }

  return (
    <>{controls ? controls(<ZoomBar />) : (<ZoomBar />)}</>
  )
}

function Reference({ reference }: { reference: number }) {
  return (
    <span className="absolute bottom-0 z-20" style={{ left: reference }}>
      <div className="w-[2px] h-[130px] bg-red-500"></div>
    </span>
  );
}

function TimelineMarks({
  sections,
  visibleTimelineWidth,
}: {
  sections: Section[],
  visibleTimelineWidth: number,
}) {
  return (
    <div className="flex flex-row items-start w-full z-[-1]">
      {sections.map((section, i) => (
        <div
          key={i}
          className="overflow-hidden"
          style={{ width: section.width + 'px' }}
        >
          {section.time ? (
            <div style={{
              position: 'relative',
              width: visibleTimelineWidth / NUMBER_OF_MARKS + 'px',
              left: section.first
                ? `-${visibleTimelineWidth / NUMBER_OF_MARKS - section.width}px`
                : undefined,
            }}>
              <span className="text-[7px]">{section.time}</span>
              <div className="w-[2px] h-[10px] bg-gray-300"></div>
              <div className="w-full h-[2px] bg-gray-300"></div>
            </div>
          ) : (
            <>
              <span className="text-[7px] text-white">h</span>
              <div className="w-[2px] h-[10px]"></div>
              <div className="w-full h-[2px] bg-gray-300"></div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Images({
  sections,
  imageUrl,
  offset,
  visibleTimelineWidth,
  source,
}: {
  sections: Section[],
  imageUrl: string,
  offset: number,
  visibleTimelineWidth: number,
  source: SourceType,
}) {
  const imageHeight = useMemo(
    () => visibleTimelineWidth / NUMBER_OF_MARKS * source.height! / source.width!
    , [visibleTimelineWidth, source]
  );

  return (
    <>
      {
        sections.map((section, i) => (
          <div
            key={i}
            style={{ width: section.width + 'px', zIndex: -1 }}
          >
            <div
              className=""
              style={{
                width: (visibleTimelineWidth / NUMBER_OF_MARKS) + 'px',
                height: imageHeight + 'px',
                overflowY: 'hidden',
                overflowX: 'clip',
              }}
            >
              <img
                src={`${imageUrl}_${Math.floor(offset) + section.second + 1}.jpg`}
                alt="Timeline"
                style={{
                  position: 'relative',
                  width: visibleTimelineWidth / NUMBER_OF_MARKS + 'px',
                  height: imageHeight + 'px',
                  left: section.first
                    ? `-${visibleTimelineWidth / NUMBER_OF_MARKS - section.width}px`
                    : section.last
                      ? 0
                      : undefined,
                }}
              />
            </div>
          </div>
        ))
      }
    </>
  );
}
