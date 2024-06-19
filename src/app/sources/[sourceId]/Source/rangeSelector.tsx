'use client';

import { useState } from "react";

export default function RangeSelection({
  timelineWidth,
  zoom,
  length,
  range,
  setRange,
  rangeCreated,
  setRangeCreated,
}: {
  timelineWidth: number,
  zoom: number,
  length: number
  range: [number, number],
  setRange: (range: [number, number]) => void,
  rangeCreated: boolean,
  setRangeCreated: (created: boolean) => void,
}) {
  const [creatingRange, setCreatingRage] = useState(false);
  const [pxRange, setPxRange] = useState<[number, number]>([0, 0]);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    console.log('mouse down');

    if (rangeCreated) return;

    const startSec = percent(e) * length;
    setRange([startSec, startSec]);

    const pxStart = timelineWidth * zoom * percent(e);
    setPxRange([pxStart, pxStart]);

    setCreatingRage(true);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    if (rangeCreated) return;
    if (!creatingRange) return;

    const endSec = percent(e) * length;
    setRange([range[0], endSec]);

    const pxEnd = timelineWidth * zoom * percent(e);
    setPxRange([pxRange[0], pxEnd]);
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    if (rangeCreated) return;

    const endSec = percent(e) * length;
    setRange([range[0], endSec]);

    const pxEnd = timelineWidth * zoom * percent(e);
    setPxRange([pxRange[0], pxEnd]);

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
          left: pxRange[0],
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
            X
          </span>
        )}
      </div>
    </div>);
}

