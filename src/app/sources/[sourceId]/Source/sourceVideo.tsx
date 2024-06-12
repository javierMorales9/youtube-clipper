'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer } from '../useTimer';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

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
          sources: [{
            src,
            type: 'application/x-mpegURL'
          }],
          currentTime: startTime || 0,
        },
        () => {
          player.on('loadedmetadata', () => {
            setVideoWidth(width || player.videoWidth());
            setVideoHeight(player.videoHeight());
            setLength(player.duration() || 0);
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
    if (Math.abs(currentSeconds - movie.currentTime()!) < a)
      return;

    movie.currentTime(startTime + currentSeconds);
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    const movie = playerRef.current;
    if (movie)
      movie.pause();
  }

  function play() {
    const movie = playerRef.current;

    if (movie)
      movie.play()?.catch(console.error);
  }

  return (
    <div data-vjs-player style={{ width: videoWidth!*height!/videoHeight! }}>
      <div ref={videoRef} />
    </div>
  );
}
