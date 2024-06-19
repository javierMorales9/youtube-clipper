'use client';
import { toReadableTime } from '@/app/utils';
import { Source } from '@/server/db/schema';
import { useState, MouseEvent, useRef, useEffect, useMemo, FC } from 'react';

export default function Timeline({
  length,
  imageUrl,
  source,
  currentTime,
  currentSeconds,
  setCurrentTime,
  children,
  zoom,
}: {
  length: number,
  imageUrl: string,
  source: Source,
  currentTime: [number, number, number, number]
  currentSeconds: number,
  setCurrentTime: (time: number) => void,
  children?: (timelineWidth: number, zoom: number, length: number) => JSX.Element,
  zoom: number,
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const timeLineRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center gap-y-4"
    > 
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
                  src={imageUrl}
                  alt="Timeline"
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

