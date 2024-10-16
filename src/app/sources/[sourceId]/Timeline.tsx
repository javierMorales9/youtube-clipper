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
  controls,
  children,
}: {
  length: number,
  imageUrl: string,
  source: Source,
  currentSeconds: number,
  setCurrentTime: (time: number) => void,
  offset?: number,
  sourceLength?: number,
  controls?: (ZoomBar: JSX.Element) => JSX.Element,
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

  const timelineWidth = useMemo(
    () => visibleTimelineWidth * marks / NUMBER_OF_MARKS,
    [visibleTimelineWidth, marks]
  );
  const reference = useMemo(
    () => timelineWidth * currentSeconds / length - initialPosition,
    [timelineWidth, currentSeconds, length, initialPosition]
  );

  const imageHeight = useMemo(
    () => visibleTimelineWidth / NUMBER_OF_MARKS * source.height! / source.width!
    , [imageRef.current, visibleTimelineWidth, source]
  );

  function changeZoom(newZoom: number) {
    setZoom(newZoom);
  }

  useEffect(() => {
    //Wee need to update the initial position so that the current time mark 
    //is in the middle of the visible timeline
    //If we don't do this, the timeline will be calculated from the initial position
    //prior to the zoom change, which can be very far from the current visible timeline

    const newInitialPosition = currentSeconds / length * timelineWidth - visibleTimelineWidth / 2;
    setInitialPosition(newInitialPosition < 0 ? 0 : newInitialPosition);
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
    //Depending if the user is scrolling with the mouse wheel or the trackpad
    //we get the deltaY or deltaX value
    const value = Math.abs(e.deltaY) !== 0 ? e.deltaY : e.deltaX;

    setInitialPosition(prev => {
      const newPosition = prev + value;

      if (newPosition < 0) return 0;
      if (newPosition > timelineWidth - visibleTimelineWidth)
        return prev + (timelineWidth - visibleTimelineWidth - prev) / 2;

      return newPosition;
    });
  }

  const sections = useMemo(() => {
    const markWidth = visibleTimelineWidth / NUMBER_OF_MARKS;
    const leftMark = Math.abs(initialPosition) / timelineWidth * marks;

    const offset = leftMark % 1;
    const complete = Math.floor(offset * 100) === 0;

    const result: {
      width: number,
      time?: string,
      second: number,
      first?: boolean,
      last?: boolean,
    }[] = [];

    if (complete) {
      result.push({
        width: markWidth,
        time: toReadableTime(Math.floor(leftMark) * markSecInc),
        second: Math.floor(Math.floor(leftMark) * markSecInc),
        first: true,
      });
    } else {
      result.push({
        width: markWidth * (1 - offset),
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

    result.push({
      width: markWidth * (offset),
      time: toReadableTime((Math.floor(leftMark) + NUMBER_OF_MARKS) * markSecInc),
      second: Math.floor((Math.floor(leftMark) + NUMBER_OF_MARKS) * markSecInc),
      last: true,
    });

    return result;

  }, [initialPosition, timelineWidth, visibleTimelineWidth, marks]);

  function ZoomBar() {
    return (
      <>
        {length && Math.floor(length / NUMBER_OF_MARKS - 1) > 1 && (
          <div className="w-full flex flex-col items-start">
            <input
              type="range"
              min={1}
              value={zoom}
              max={maxZoom}
              step={2}
              onChange={(e) => changeZoom(parseInt(e.target.value))}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {controls ? controls(<ZoomBar />) : (<ZoomBar />)}
      <div
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
                      className="overflow-hidden"
                      style={{ width: section.width + 'px' }}
                    >
                      {
                        section.time ? (
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

