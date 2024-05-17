'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer } from '../useTimer';

export default function Video({
  src,
  startTime,
  timer: {
    length,
    setLength,
    currentTime,
    playing,
  }
}: {
  src: string,
  startTime?: number,
  timer: Timer,
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [movie, setMovie] = useState<HTMLVideoElement | null>(null);
  const [videoTimer, setVideoTimer] = useState<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    if (movie)
      movie.currentTime = toSeconds(currentTime);
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function initializeVideo(video: HTMLVideoElement) {
    if (startTime)
      video.currentTime = startTime;
    else
      video.currentTime = 0;
  }

  function pause() {
    clearInterval(videoTimer!);
    setVideoTimer(null);

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


    setVideoTimer(vidT);

    movie?.play().catch(console.error);
  }

  function toSeconds(time: [number, number]): number {
    return time[0] * 60 + time[1];
  }

  return (
    <div>
      <div className="w-full flex justify-center items-center">
        <canvas ref={canvasRef} width={1280} height={720} className="w-[960px] h-[540px]"></canvas>
      </div>
    </div>
  );
}

