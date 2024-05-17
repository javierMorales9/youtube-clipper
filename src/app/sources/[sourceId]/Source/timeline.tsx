'use client';
import { useState, MouseEvent, useRef, useEffect, useMemo } from 'react';

export default function Timeline({
  length,
  currentTime,
  setCurrentTime,
}: {
  length: number,
  currentTime: [number, number]
  setCurrentTime: (time: number) => void
}) {
  const timelineWidth = 1200;
  const timeLineRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);

  const reference = useMemo(
    () => timelineWidth * zoom * currSec() / length,
    [zoom, currentTime, length]
  );
  const markSecInc = useMemo(() => length / (7 * zoom), [length, zoom]);
  const marks = useMemo(() => 7 * zoom, [zoom]);
  const leftPxInc = useMemo(() => timelineWidth * zoom / marks, [zoom, marks]);

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


  function handleTimelineClick(e: MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const percent = (e.clientX - bcr.left) / bcr.width;
    setCurrentTime(percent * length);
  }

  function currSec() {
    return currentTime[0] * 60 + currentTime[1];
  }

  function toReadableTime(time: number | undefined) {
    if (!time) return '00:00';

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
  }

  return (
    <div className="w-full flex flex-col items-center gap-y-4">
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
          className="flex flex-col relative"
          onClick={handleTimelineClick}
        >
          <span className="absolute" style={{ left: reference }}>
            <div className="w-[2px] h-[34px] bg-red-500"></div>
          </span>
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
