import { useState } from "react";

export function useTimer() {
  const [length, setLength] = useState<number | null>(37);
  const [currentTime, setCurrentTime] = useState<[number, number]>([0, 0]);
  const [movie, setMovie] = useState<HTMLVideoElement | null>(null);

  function seek(time: number) {
    setCurrentTime(formatTime(time));
    movie!.currentTime = time;
  }

  function formatTime(time: number): [number, number] {
    return [Math.floor(time / 60), Math.floor(time % 60)];
  }

  return {
    length,
    setLength,
    currentTime,
    setCurrentTime,
    movie,
    setMovie,
    seek,
  };
}

export type Timer = ReturnType<typeof useTimer>;
