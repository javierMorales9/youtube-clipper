'use client';
import { useEffect, useRef, useState } from 'react';
import Timeline from '@/app/sources/[sourceId]/timeline';

export default function Video({
  src,
  startTime,
  length,
  setLength,
  currentTime,
  setCurrentTime,
  movie,
  setMovie,
}: {
  src: string,
  startTime?: number,
  length: number | null,
  setLength: (length: number) => void,
  currentTime: [number, number] | null,
  setCurrentTime: (time: [number, number]) => void
  movie: HTMLVideoElement | null,
  setMovie: (movie: HTMLVideoElement) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [playing, setPlaying] = useState(false);
  const [videoTimer, setVideoTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [timelineTimer, setTimelineTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return

    const video = document.createElement('video');
    video.src = src;
    video.controls = false;
    video.autoplay = false;

    initializeVideo(video);

    const context = canvas.getContext('2d');
    if (!context) return;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (!length) {
        setLength(video.duration);
      }
    }

    setMovie(video);
  }, []);

  function initializeVideo(video: HTMLVideoElement) {
    if (startTime)
      video.currentTime = startTime;
    else
      video.currentTime = 0;
  }

  function togglePlay() {
    if (playing)
      pause();
    else
      play();
  }

  function pause() {
    clearInterval(videoTimer!);
    setVideoTimer(null);

    clearInterval(timelineTimer!);
    setTimelineTimer(null);

    setPlaying(false);

    movie?.pause();
  }

  function play() {
    const vidT = setInterval(() => {
      if (!movie) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(movie, 0, 0);
    }, 1000 / 30);

    const timeT = setInterval(() => {
      setCurrentTime(ct => {
        const result = increaseTime(ct)

        if (toSeconds(result) >= length!) {
          initializeVideo(movie!);
          return [0, 0];
        }

        return result;

      });
    }, 1000);

    setVideoTimer(vidT);
    setTimelineTimer(timeT);
    setPlaying(true);

    movie?.play().catch(console.error);
  }


  function increaseTime(time: [number, number]): [number, number] {
    const [minutes, seconds] = time;
    const result: [number, number] = seconds === 59 ? [minutes + 1, 0] : [minutes, seconds + 1];

    return result;
  }

  function toSeconds(time: [number, number]): number {
    return time[0] * 60 + time[1];
  }

  return (
    <div>
      <div className="w-full flex justify-center items-center">
        <canvas ref={canvasRef} width={1280} height={720} className="w-[960px] h-[540px]"></canvas>
        <button onClick={() => togglePlay()}>{playing ? 'Stop' : 'Play'}</button>
      </div>
    </div>
  );
}

