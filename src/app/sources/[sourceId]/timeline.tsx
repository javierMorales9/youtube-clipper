'use client';
import { toReadableTime } from '@/app/utils';
import { Source } from '@/server/db/schema';
import { useState, MouseEvent, WheelEvent, useRef, useEffect, useMemo } from 'react';

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
    return -(gap + 1 - length / 8) / gap;
  }, [length]);

  const marks = useMemo(() =>
    length * (maxZoom - 1) / (zoom * (1 - length / 8) + maxZoom  / 8 * length - 1)
    , [zoom, length]);
  const markSecInc = useMemo(() => length / marks, [length, marks]);

  const timelineWidth = useMemo(() => visibleTimelineWidth * marks / 8, [visibleTimelineWidth, zoom]);
  const reference = useMemo(() => {
    return timelineWidth * currentSeconds / length - initialPosition;
  }, [timelineWidth, currentSeconds, length, initialPosition]);

  const imageHeight = useMemo(() => {
    const image = imageRef.current;
    if (!image) return 0;

    const calculated = visibleTimelineWidth / 8 * source.height! / source.width!;
    const extracted = image.height / sourceLength;

    //Formula caculated empirically
    const real = (calculated + 29 * extracted) / 30;

    return real;
  }, [imageRef.current, visibleTimelineWidth, source]);

  useEffect(() => {
    const timelineScroll = (currentSeconds / length) * timelineWidth - visibleTimelineWidth / 2;

    const timeline = timeLineRef.current;
    if (!timeline) return;

    timeline.scrollTo(timelineScroll, 0);
  }, [timelineWidth]);

  function handleTimelineClick(e: MouseEvent<HTMLDivElement>) {
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
    const markWidth = visibleTimelineWidth / 8;
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
    for (let i = 1; i < 8; i++) {
      result.push({
        width: markWidth,
        time: toReadableTime((i + Math.floor(leftMark)) * markSecInc),
        second: Math.floor((i + Math.floor(leftMark)) * markSecInc),
      });
    }

    if (leftMark + 8 < marks)
      result.push({
        width: markWidth * (offset),
        time: toReadableTime((Math.floor(leftMark) + 8) * markSecInc),
        second: Math.floor((Math.floor(leftMark) + 8) * markSecInc),
        last: true,
      });

    return result;

  }, [initialPosition, timelineWidth, visibleTimelineWidth]);

  return (
    <>
      {length && Math.floor(length / 7) > 1 && (
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
              <>
                {children && children(
                  visibleTimelineWidth,
                  visibleTimelineWidth / timelineWidth * length,
                  initialPosition,
                  initialPosition / timelineWidth * length,
                )}
                <div className="flex flex-row justify-start z-[-1]">
                  {sections.map((section, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-start gap-y-2"
                      style={{ width: section.width + 'px' }}
                    >
                      <div className="w-full">
                        {section.time ? (
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
                        )}
                      </div>
                      <div
                        key={i}
                        className=""
                        style={{
                          width: visibleTimelineWidth / 8 + 'px',
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
                            width: visibleTimelineWidth / 8 + 'px',
                            top: `-${imageHeight * (Math.floor(offset) + section.second)}px`,
                            left: section.first
                              ? `-${visibleTimelineWidth / 8 - section.width}px`
                              : section.last
                                ? 0
                                : undefined,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div >
    </>
  );
}

