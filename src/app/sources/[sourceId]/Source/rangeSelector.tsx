'use client';

import { useState } from "react";

export default function RangeSelection({
  timelineWidth,
  zoom,
  length
}: {
  timelineWidth: number,
  zoom: number,
  length: number
}) {
  const [creatingRange, setCreatingRage] = useState(false);
  const [rangeCreated, setRangeCreated] = useState(false);
  const [pxRange, setPxRange] = useState<[number, number]>([0, 0]);
  const [range, setRange] = useState<[number, number]>([0, 0]);

  function handleMouseDown(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    if (rangeCreated) return;

    const startSec = percent(e) * length;
    setRange([startSec, startSec]);

    const pxStart = timelineWidth * zoom * percent(e);
    setPxRange([pxStart, pxStart]);

    setCreatingRage(true);
  }

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    if (rangeCreated) return;
    if (!creatingRange) return;

    const endSec = percent(e) * length;
    setRange([range[0]!, endSec]);

    const pxEnd = timelineWidth * zoom * percent(e);
    setPxRange([pxRange[0]!, pxEnd]);
  }

  function handleMouseUp(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();

    if (rangeCreated) return;

    const endSec = percent(e) * length;
    setRange([range[0]!, endSec]);

    const pxEnd = timelineWidth * zoom * percent(e);
    setPxRange([pxRange[0]!, pxEnd]);

    setCreatingRage(false);
    setRangeCreated(true);
  }

  function deleteRange(e: MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setRange([0, 0]);
    setPxRange([0, 0]);
    setRangeCreated(false);
  }

  function percent(e: MouseEvent<HTMLDivElement>) {
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
        className="absolute h-[40px]"
        style={{
          left: pxRange[0],
          width: pxRange[1] - pxRange[0],
        }}
      >
        <div
          className="absolute top-0 w-full h-full z-[-1]"
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

