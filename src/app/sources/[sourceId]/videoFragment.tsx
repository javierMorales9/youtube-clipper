'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer } from './useTimer';

export default function Video({
  src,
  startTime = 0,
  timer: {
    length,
    setLength,
    currentTime,
    playing,
  },
  x,
  y,
  width,
  height,
  clip: {
    x: clipX,
    y: clipY,
    width: clipWidth,
    height: clipHeight,
  },
}: {
  src: string,
  startTime: number,
  timer: Timer,
  x: number,
  y: number,
  width: number,
  height: number,
  clip: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
  positionOffset: number,
}) {
  console.log(clipWidth, width);
  const movieRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = movieRef.current;
    if (!video) return

    video.src = src;
    video.controls = false;
    video.autoplay = false;
    video.muted = true;
    video.width = 960;
    video.height = 540;

    initializeVideo(video);

    video.onloadedmetadata = () => {
      if (!length) {
        setLength(video.duration);
      }
    }
  }, []);

  useEffect(() => {
    const movie = movieRef.current;
    if (movie)
      movie.currentTime = startTime + toSeconds(currentTime);
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
    movieRef?.current?.pause();
  }

  function play() {
    movieRef?.current?.play().catch(console.error);
  }

  function toSeconds(time: [number, number]): number {
    return time[0] * 60 + time[1];
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: clipWidth,
        height: clipHeight,
        transformOrigin: 'left top',
        transform: `scale(${width/clipWidth}, ${height/clipHeight})`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 960,
          height: 540,
          left: -clipX,
          top: -clipY,
        }}
      >
        <video ref={movieRef} />
      </div>
    </div>
  );
}
