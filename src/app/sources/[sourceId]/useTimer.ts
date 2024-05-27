import { useState } from "react";

export function useTimer(duration?: number) {
  const increaseIncrement = 1000 / 5;
  const [length, setLength] = useState<number | null>(duration || null);
  const [currentTime, setCurrentTime] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [playing, setPlaying] = useState(false);

  const [timelineTimer, setTimelineTimer] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  function seek(time: number) {
    setCurrentTime(formatTime(time));
  }

  function formatTime(time: number): [number, number, number, number] {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor(time % 3600 / 60);
    const seconds = Math.floor(time % 3600 % 60);
    const milliseconds = Math.floor((time % 3600 % 60 - seconds) * 1000);

    return [hours, minutes, seconds, milliseconds];
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
          return [0, 0, 0, 0];
        }

        return result;
      });
    }, increaseIncrement);

    setTimelineTimer(timeT);
    setPlaying(true);
  }

  function toSeconds(time: [number, number, number, number]): number {
    return time[0] * 3600 + time[1] * 60 + time[2] + time[3] / 1000;
  }

  function increaseTime(time: [number, number, number, number]): [number, number, number, number] {
    const [hours, minutes, seconds, milliseconds] = time;

    let newMilliseconds = milliseconds + increaseIncrement;
    let newSeconds = seconds;
    let newMinutes = minutes;
    let newHours = hours;

    if (newMilliseconds >= 1000) {
      newMilliseconds = 0;
      newSeconds++;
    }

    if (newSeconds >= 60) {
      newSeconds = 0;
      newMinutes++;
    }

    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours++;
    }

    return [newHours, newMinutes, newSeconds, newMilliseconds];
  }

  return {
    length,
    setLength,
    currentTime,
    setCurrentTime,
    seek,
    playing,
    togglePlay,
    currentSeconds: toSeconds(currentTime),
  };
}

export type Timer = ReturnType<typeof useTimer>;
