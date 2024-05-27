'use client';
import { Source } from '@/server/db/schema';
import { useState, MouseEvent, useRef, useEffect, useMemo, FC } from 'react';

export default function Timeline({
  length,
  source,
  currentTime,
  currentSeconds,
  setCurrentTime,
  children,
}: {
  length: number,
  source: Source,
  currentTime: [number, number, number, number]
  currentSeconds: number,
  setCurrentTime: (time: number) => void,
  children?: (timelineWidth: number, zoom: number, length: number) => JSX.Element,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const timeLineRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);

  const markSecInc = useMemo(() => length / (7 * zoom), [length, zoom]);
  const marks = useMemo(() => 8 * zoom, [zoom]);
  const leftPxInc = useMemo(() => timelineWidth * zoom / marks, [timelineWidth, zoom, marks]);
  const reference = useMemo(
    () => timelineWidth * zoom * currentSeconds / length,
    [zoom, currentSeconds, length]
  );

  const [imageHeight, setImageHeight] = useState(0);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setTimelineWidth(container.clientWidth);
  }, [containerRef.current]);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    image.onload = () => {
      setImageHeight(image.height);
    };
  }, [imageRef.current]);

  useEffect(() => {
    updateScroll(zoom);
  }, [zoom]);

  function updateScroll(zoom: number) {
    const timelineScroll = (currentSeconds / length) * timelineWidth * zoom - timelineWidth / 2;

    const timeline = timeLineRef.current;
    if (!timeline) return;

    timeline.scrollTo(timelineScroll, 0);
  }

  function modifyZoom(newZoom: number) {
    setZoom(newZoom);
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

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 3600 % 60);

    const hoursStr = hours === 0 ? '' : hours < 10 ? `0${hours}:` : `${hours}:`;
    const minutesStr = minutes < 10 ? `0${minutes}:` : `${minutes}:`;
    const secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${hoursStr}${minutesStr}${secondsStr}`;
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
      <div>{currentTime[0]} : {currentTime[1]} : {currentTime[2]}</div>
      <div
        ref={timeLineRef}
        className="flex items-start overflow-x-auto no-scrollbar"
        style={{
          width: timelineWidth + 'px',
        }}
      >
        <div
          className="flex flex-col justify-end relative"
          onClick={handleTimelineClick}
        >
          <span className="absolute bottom-0" style={{ left: reference }}>
            <div className="w-[2px] h-[100px] bg-red-500"></div>
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
          <div className="flex flex-row justify-start">
            {Array.from({ length: marks }).map((_, i) => (
              <div
                key={i}
                className="overflow-y-hidden"
                style={{
                  width: leftPxInc + 'px',
                  height: '90px',
                  overflowY: 'hidden',
                }}
              >
                <img
                  ref={imageRef}
                  src={`${source.url}/timeline1.png`} alt="Timeline"
                  style={{
                    position: 'relative',
                    width: '100%',
                    top: `-${imageHeight * i * markSecInc / length}px`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

