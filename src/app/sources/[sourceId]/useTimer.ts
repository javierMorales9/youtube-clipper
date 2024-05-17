import { useState } from "react";

export function useTimer() {
  const [length, setLength] = useState<number | null>(37);
  const [currentTime, setCurrentTime] = useState<[number, number]>([0, 0]);
  const [playing, setPlaying] = useState(false);

  const [timelineTimer, setTimelineTimer] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  function seek(time: number) {
    setCurrentTime(formatTime(time));
  }

  function formatTime(time: number): [number, number] {
    return [Math.floor(time / 60), Math.floor(time % 60)];
  }

  function togglePlay() {
    if (playing) {
      pause();
    } else {
      play();
    }
  }

  function pause() {
    clearInterval(timelineTimer!);
    setTimelineTimer(null);

    setPlaying(false);
  }

  function play() {
    const timeT = setInterval(() => {
      setCurrentTime((ct) => {
        const result = increaseTime(ct);

        if (toSeconds(result) >= length!) {
          return [0, 0];
        }

        return result;
      });
    }, 1000);

    setTimelineTimer(timeT);
    setPlaying(true);
  }

  function toSeconds(time: [number, number]): number {
    return time[0] * 60 + time[1];
  }

  function increaseTime(time: [number, number]): [number, number] {
    const [minutes, seconds] = time;
    const result: [number, number] =
      seconds === 59 ? [minutes + 1, 0] : [minutes, seconds + 1];

    return result;
  }

  return {
    length,
    setLength,
    currentTime,
    setCurrentTime,
    seek,
    playing,
    togglePlay,
  };
}

export type Timer = ReturnType<typeof useTimer>;
