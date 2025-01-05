'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer } from './useTimer';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

export default function HLSReproducer({
  src,
  startTime = 0,
  timer: {
    currentTime,
    currentSeconds,
    playing,
  },
  width,
  height,
  setDimensions,
  muted,
}: {
  src: string,
  startTime: number,
  timer: Timer,
  width?: number,
  height?: number,
  setDimensions?: (dim: [number, number]) => void,
  muted?: boolean,
}) {
  const playerRef = useRef<Player | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  const [videoWidth, setVideoWidth] = useState<number | undefined>(undefined);
  const [videoHeight, setVideoHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      video.appendChild(videoElement);

      const player = playerRef.current = videojs(
        videoElement,
        {
          autoplay: false,
          controls: false,
          responsive: true,
          fluid: true,
          muted,
          sources: [{
            src,
            type: 'application/x-mpegURL'
          }],
          currentTime: startTime || 0,
        },
        () => {
          player.on('loadedmetadata', () => {
            setVideoWidth(width || player.videoWidth() || 0);
            setVideoHeight(player.videoHeight() || 0);

            setDimensions && setDimensions([player.videoWidth(), player.videoHeight()]);
          });
        });
    }
  }, [videoRef]);

  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [playerRef]);

  useEffect(() => {
    const movie = playerRef.current;
    if (!movie) return;

    const a = 1;
    if (Math.abs(currentSeconds + startTime - movie.currentTime()!) < a)
      return;

    movie.currentTime(startTime + currentSeconds);
  }, [currentTime]);

  useEffect(() => {
    const movie = playerRef.current;
    if (!movie) return;

    if (playing)
      movie.play()?.catch(console.error);
    else
      movie.pause();
  }, [playing]);

  return (
    <div data-vjs-player style={{ width: videoWidth!*height!/videoHeight! }}>
      <div ref={videoRef} />
    </div>
  );
}
