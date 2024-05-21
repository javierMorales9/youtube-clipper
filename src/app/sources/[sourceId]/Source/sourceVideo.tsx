'use client';
import { useEffect, useRef } from 'react';
import { Timer } from '../useTimer';

export default function SourceVideo({
  src,
  startTime = 0,
  timer: {
    length,
    setLength,
    currentTime,
    currentSeconds,
    playing,
  },
  width,
  height,
}: {
  src: string,
  startTime: number,
  timer: Timer,
  width?: number,
  height?: number,
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.src = src;
    video.controls = false;
    video.autoplay = false;
    if (width)
      video.width = width;
    if (height)
      video.height = height;

    if (startTime)
      video.currentTime = startTime;
    else
      video.currentTime = 0;

    video.onloadedmetadata = () => {
      if (!length) {
        setLength(video.duration);
      }
    }
  }, [videoRef]);

  useEffect(() => {
    const movie = videoRef.current;
    if (!movie) return;

    const a = 1;
    if (Math.abs(currentSeconds - movie.currentTime) < a)
      return;

    movie.currentTime = startTime + currentSeconds;
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    const movie = videoRef.current;
    if (movie)
      movie?.pause();
  }

  function play() {
    const movie = videoRef.current;

    if (movie)
      movie?.play().catch(console.error);
  }

  return (
    <video 
      ref={videoRef} 
      style={{ width, height }}
    />
  );
}
