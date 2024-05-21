'use client';
import { useEffect, useRef } from 'react';
import { Timer } from '../../useTimer';

export default function VideoFragment({
  src,
  startTime = 0,
  timer: {
    length,
    setLength,
    currentTime,
    playing,
    currentSeconds
  },
  dimensions,
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
  dimensions: [number, number],
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
}) {
  const movieRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = movieRef.current;
    if (!video) return

    video.src = src;
    video.controls = false;
    video.autoplay = false;
    video.muted = true;

    initializeVideo(video);

    video.onloadedmetadata = () => {
      if (!length) {
        setLength(video.duration);
      }
    }
  }, []);

  useEffect(() => {
    const movie = movieRef.current;
    if (!movie) return;

    movie.width = dimensions[0];
    movie.height = dimensions[1];
  }, [dimensions]);

  useEffect(() => {
    const movie = movieRef.current;
    if (movie)
      movie.currentTime = startTime + currentSeconds;
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
          width: dimensions[0],
          height: dimensions[1],
          left: -clipX,
          top: -clipY,
        }}
      >
        <video ref={movieRef} />
      </div>
    </div>
  );
}
