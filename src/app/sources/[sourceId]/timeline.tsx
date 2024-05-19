'use client';
import { useState, MouseEvent, useRef, useEffect, useMemo, FC } from 'react';

export default function Timeline({
  length,
  currentTime,
  setCurrentTime,
  children,
}: {
  length: number,
  currentTime: [number, number]
  setCurrentTime: (time: number) => void,
  children?: (timelineWidth: number, zoom: number, length: number) => JSX.Element,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const timeLineRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);

  const markSecInc = useMemo(() => length / (7 * zoom), [length, zoom]);
  const marks = useMemo(() => 7 * zoom, [zoom]);
  const leftPxInc = useMemo(() => timelineWidth * zoom / marks, [timelineWidth, zoom, marks]);

  const reference = useMemo(
    () => timelineWidth * zoom * currSec() / length,
    [zoom, currentTime, length]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setTimelineWidth(container.clientWidth);
  }, [containerRef.current]);

  useEffect(() => {
    updateScroll(zoom);
  }, [zoom]);

  function updateScroll(zoom: number) {
    const timelineScroll = (currSec() / length) * timelineWidth * zoom - timelineWidth / 2;

    const timeline = timeLineRef.current;
    if (!timeline) return;

    timeline.scrollTo(timelineScroll, 0);
  }

  function modifyZoom(newZoom: number) {
    setZoom(newZoom);
  }

  function currSec() {
    return currentTime[0] * 60 + currentTime[1];
  }

  function handleTimelineClick(e: MouseEvent<HTMLDivElement>) {
    const second = percent(e) * length;
    setCurrentTime(second);
  }


  function percent(e: MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);
    return clientX / bcr.width;
  }

  function toReadableTime(time: number | undefined) {
    if (!time) return '00:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center gap-y-4"
    >
      <input
        type="range"
        min={1}
        max={10}
        value={zoom}
        onChange={(e) => modifyZoom(parseInt(e.target.value))}
      />
      <div>{currentTime[0]} : {currentTime[1]}</div>
      <div
        ref={timeLineRef}
        className="flex items-start overflow-x-auto no-scrollbar"
        style={{
          width: timelineWidth + 'px',
        }}
      >
        <div
          className="flex flex-col justify-end relative h-10"
          onClick={handleTimelineClick}
        >
          <span className="absolute bottom-0" style={{ left: reference }}>
            <div className="w-[2px] h-[54px] bg-red-500"></div>
          </span>
          {children && children(timelineWidth, zoom, length)}
          <div className="flex flex-row justify-start">
            {Array.from({ length: marks }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-start"
                style={{ width: leftPxInc + 'px' }}
              >
                <span className="text-[7px]">{toReadableTime(i * markSecInc)}</span>
                <div className="w-[2px] h-[10px] bg-gray-300"></div>
              </div>
            ))}
          </div>
          <div className="h-[3px] bg-gray-300" style={{ width: timelineWidth * zoom + 'px' }}></div>
        </div>
      </div>
    </div>
  );
}

