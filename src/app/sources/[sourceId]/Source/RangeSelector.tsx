'use client';

import { useEffect, useState } from "react";
import Cross from "../../../../../public/images/Cross.svg";

export default function RangeSelection({
  visibleTimelineWidth,
  timelineSeconds,
  initialSeconds,
  initialPosition,
  range,
  setRange,
  rangeCreated,
  setRangeCreated,
}: {
  visibleTimelineWidth: number,
  timelineSeconds: number,
  initialPosition: number,
  initialSeconds: number,
  range: [number, number],
  setRange: (range: [number, number]) => void,
  rangeCreated: boolean,
  setRangeCreated: (created: boolean) => void,
}) {
  const [creatingRange, setCreatingRage] = useState(false);
  const [pxRange, setPxRange] = useState<[number, number]>([0, 0]);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    if (rangeCreated) return;

    const startSec = initialSeconds + percent(e) * timelineSeconds;
    setRange([startSec, startSec]);

    const pxStart = initialPosition + visibleTimelineWidth * percent(e);
    setPxRange([pxStart, pxStart]);

    setCreatingRage(true);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    if (rangeCreated || !creatingRange) return;

    const endSec = initialSeconds + percent(e) * timelineSeconds;

    if (endSec < range[1]) {
      setRange([endSec, range[1]]);

      const pxEnd = initialPosition + visibleTimelineWidth * percent(e);
      setPxRange([pxEnd, pxRange[1]]);
    }
    else {
      setRange([range[0], endSec]);

      const pxEnd = initialPosition + visibleTimelineWidth * percent(e);
      setPxRange([pxRange[0], pxEnd]);
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (rangeCreated) return;

    if(range[0] === range[1]) {
      setRange([0, 0]);
      setPxRange([0, 0]);
      setCreatingRage(false);
      setRangeCreated(false);
      return;
    }

    setCreatingRage(false);
    setRangeCreated(true);
  }

  function deleteRange(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setRange([0, 0]);
    setPxRange([0, 0]);
    setRangeCreated(false);
  }

  function percent(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.currentTarget as HTMLDivElement;
    const bcr = target.getBoundingClientRect();
    const clientX = (e.clientX - bcr.left);
    return clientX / bcr.width;
  }

  useEffect(() => {
    if (rangeCreated) {
      setPxRange([
        initialPosition + visibleTimelineWidth * (range[0] - initialSeconds) / timelineSeconds,
        initialPosition + visibleTimelineWidth * (range[1] - initialSeconds) / timelineSeconds,
      ]);
    }
  }, [range]);

  return (
    <div
      className="absolute w-full h-full bottom-0"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className="absolute h-full z-10"
        style={{
          left: pxRange[0] - initialPosition,
          width: pxRange[1] - pxRange[0],
        }}
      >
        <div
          className="absolute top-0 w-full h-full"
          style={{ backgroundColor: 'rgba(255, 165, 0, 0.7)' }}
        ></div>
        {rangeCreated && (
          <span
            className="absolute right-0 top-0 text-black cursor-pointer"
            onClick={deleteRange}
          >
            <Cross className="w-6 h-6 fill-black" />
          </span>
        )}
      </div>
    </div>);
}

