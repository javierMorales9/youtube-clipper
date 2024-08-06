'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer } from '../useTimer';

export default function MP4Reproducer({
  src,
  startTime = 0,
  timer: {
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
  const containerRef = useRef<HTMLDivElement>(null);
  let videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoWidth, setVideoWidth] = useState<number | undefined>(undefined);
  const [videoHeight, setVideoHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!videoRef.current) {
      const videoElement = document.createElement("video");
      videoElement.src = src;
      videoElement.autoplay = false;
      videoElement.controls = false;

      videoRef.current = videoElement;

      videoElement.addEventListener('loadedmetadata', () => {
        setVideoWidth(width || videoElement.videoWidth);
        setVideoHeight(videoElement.videoHeight);
        setLength(videoElement.duration);
      });

      container.appendChild(videoElement);
    }
  }, [containerRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const a = 1;
    if (Math.abs(currentSeconds - video.currentTime!) < a)
      return;

    video.currentTime = startTime + currentSeconds;
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    const video = videoRef.current;

    if (video)
      video.pause();
  }

  function play() {
    const video = videoRef.current;

    if (video)
      video.play()?.catch(console.error);
  }

  return (
    <div style={{ width: `${videoWidth! * height! / videoHeight!}px` }}>
      <div ref={containerRef} />
    </div>
  );
}
