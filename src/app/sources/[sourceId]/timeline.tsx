'use client';
import { toReadableTime } from '@/app/utils';
import { Source } from '@/server/db/schema';
import { useState, MouseEvent, WheelEvent, useRef, useEffect, useMemo } from 'react';

const NUMBER_OF_MARKS = 6;

export default function Timeline({
  length,
  imageUrl,
  source,
  currentSeconds,
  setCurrentTime,
  offset = 0,
  sourceLength = length,
  children,
}: {
  length: number,
  imageUrl: string,
  source: Source,
  currentSeconds: number,
  setCurrentTime: (time: number) => void,
  offset?: number,
  sourceLength?: number,
  children?: (visibleTimelineWidth: number, timelineSeconds: number, initialPosition: number, initialSeconds: number) => JSX.Element,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const timeLineRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [initialPosition, setInitialPosition] = useState(0);
  const [zoom, setZoom] = useState(1);

  const visibleTimelineWidth = useMemo(() => {
    const container = containerRef.current;
    if (!container) return 0;

    return container.clientWidth;
  }, [containerRef.current]);

  const maxZoom = useMemo(() => {
    const gap = 1;
    return -(gap + 1 - length / NUMBER_OF_MARKS) / gap;
  }, [length]);

  const marks = useMemo(() =>
    length * (maxZoom - 1) / (zoom * (1 - length / NUMBER_OF_MARKS) + maxZoom / NUMBER_OF_MARKS * length - 1)
    , [zoom, length]);
  const markSecInc = useMemo(() => length / marks, [length, marks]);

  const timelineWidth = useMemo(() => visibleTimelineWidth * marks / NUMBER_OF_MARKS, [visibleTimelineWidth, zoom]);
  const reference = useMemo(() => {
    return timelineWidth * currentSeconds / length - initialPosition;
  }, [timelineWidth, currentSeconds, length, initialPosition]);

  const imageHeight = useMemo(() => {
    const image = imageRef.current;
    if (!image) return 0;

    const calculated = visibleTimelineWidth / NUMBER_OF_MARKS * source.height! / source.width!;
    const extracted = image.height / sourceLength;

    //Formula caculated empirically
    const real = (calculated + 29 * extracted) / 30;

    return real;
  }, [imageRef.current, visibleTimelineWidth, source]);

  useEffect(() => {
    //Update the timeline scroll, basically, how much space we need to move the timeline
    //to the left so that the current time mark is in the middle of the visible timeline
    //Take into account that the timeline width expands as we zoom in and that the visible
    //timeline width is fixed and doesn't depend on the zoom level.
    const timelineScroll = (currentSeconds / length) * timelineWidth - visibleTimelineWidth / 2;

    const timeline = timeLineRef.current;
    if (!timeline) return;

    timeline.scrollTo(timelineScroll, 0);
  }, [timelineWidth]);

  function handleTimelineClick(e: MouseEvent<HTMLDivElement>) {
    console.log("timeline click");
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);

    const percent = (initialPosition + clientX) / timelineWidth;

    const second = percent * length;
    setCurrentTime(second);
  }

  function scroll(e: WheelEvent<HTMLDivElement>) {
    let value = Math.abs(e.deltaY) !== 0 ? e.deltaY : e.deltaX;
    const direction = value > 0 ? 1 : -1;
    value = Math.abs(value);

    setInitialPosition(prev => {
      const newPosition = prev + value * direction;

      if (newPosition < 0) return 0;
      if (newPosition > timelineWidth - visibleTimelineWidth)
        return prev + (timelineWidth - visibleTimelineWidth - prev) / 2;

      return newPosition;
    });
  }

  const sections = useMemo(() => {
    const markWidth = visibleTimelineWidth / NUMBER_OF_MARKS;
    const leftMark = initialPosition / timelineWidth * marks;

    const offset = leftMark % 1;
    const complete = Math.floor(offset * 100) === 0;

    const result: {
      width: number,
      time?: string,
      second: number,
      first?: boolean,
      last?: boolean,
    }[] = [];

    if (!complete) {
      result.push({
        width: markWidth * (1 - offset),
        second: Math.floor(Math.floor(leftMark) * markSecInc),
        first: true,
      });
    } else {
      result.push({
        width: markWidth,
        time: toReadableTime(Math.floor(leftMark) * markSecInc),
        second: Math.floor(Math.floor(leftMark) * markSecInc),
        first: true,
      });
    }
    for (let i = 1; i < NUMBER_OF_MARKS; i++) {
      result.push({
        width: markWidth,
        time: toReadableTime((i + Math.floor(leftMark)) * markSecInc),
        second: Math.floor((i + Math.floor(leftMark)) * markSecInc),
      });
    }

    if (leftMark + NUMBER_OF_MARKS < marks)
      result.push({
        width: markWidth * (offset),
        time: toReadableTime((Math.floor(leftMark) + NUMBER_OF_MARKS) * markSecInc),
        second: Math.floor((Math.floor(leftMark) + NUMBER_OF_MARKS) * markSecInc),
        last: true,
      });

    return result;

  }, [initialPosition, timelineWidth, visibleTimelineWidth]);

  return (
    <>
      {length && Math.floor(length / NUMBER_OF_MARKS - 1) > 1 && (
        <div className="w-full flex flex-col items-start">
          <input
            type="range"
            min={1}
            value={zoom}
            max={maxZoom}
            onChange={(e) => setZoom(parseInt(e.target.value))}
          />
        </div>
      )}
      < div
        ref={containerRef}
        className="w-full flex flex-col items-center gap-y-4"
      >
        <div
          ref={timeLineRef}
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
            <span className="absolute bottom-0 z-10" style={{ left: reference }}>
              <div className="w-[2px] h-[130px] bg-red-500"></div>
            </span>
            {visibleTimelineWidth && (
              <div className="flex flex-col justify-start items-start">
                <div className="flex flex-row items-start w-full z-[-1]">
                  {sections.map((section, i) => (
                    <div
                      key={i}
                      style={{ width: section.width + 'px' }}
                    >
                      {
                        section.time ? (
                          <>
                            <span className="text-[7px]">{section.time}</span>
                            <div className="w-[2px] h-[10px] bg-gray-300"></div>
                            <div className="w-full h-[2px] bg-gray-300"></div>
                          </>
                        ) : (
                          <>
                            <span className="text-[7px] text-white">h</span>
                            <div className="w-[2px] h-[10px]"></div>
                            <div className="w-full h-[2px] bg-gray-300"></div>
                          </>
                        )
                      }
                    </div>
                  ))}
                </div>
                <div className="relative flex flex-row items-start">
                  {children && children(
                    visibleTimelineWidth,
                    visibleTimelineWidth / timelineWidth * length,
                    initialPosition,
                    initialPosition / timelineWidth * length,
                  )}
                  {sections.map((section, i) => (
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
                          ref={imageRef}
                          src={imageUrl}
                          alt="Timeline"
                          style={{
                            position: 'relative',
                            width: visibleTimelineWidth / NUMBER_OF_MARKS + 'px',
                            top: `-${imageHeight * (Math.floor(offset) + section.second)}px`,
                            left: section.first
                              ? `-${visibleTimelineWidth / NUMBER_OF_MARKS - section.width}px`
                              : section.last
                                ? 0
                                : undefined,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

