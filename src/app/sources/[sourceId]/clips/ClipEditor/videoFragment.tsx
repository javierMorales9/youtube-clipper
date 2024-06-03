'use client';
import { useEffect, useRef } from 'react';
import { Timer } from '../../useTimer';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

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
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      video.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: false,
        responsive: true,
        fluid: true,
        sources: [{
          src: `${src}/adaptive.m3u8`,
          type: 'application/x-mpegURL'
        }],
      },
        () => {
          videojs.log('player is ready');
        }
      );
    }

    /*
    const video = videoRef.current;
    if (!video) return

    video.src = src;
    video.controls = false;
    video.autoplay = false;
    video.muted = true;


    if (startTime)
      video.currentTime = startTime;
    else
      video.currentTime = 0;

    video.onloadedmetadata = () => {
      if (!length) {
        setLength(video.duration);
      }
    }
    */
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

    movie.width(dimensions[0]);
    movie.height(dimensions[1]);
  }, [dimensions]);

  useEffect(() => {
    const movie = playerRef.current;
    if (movie) {
      movie.currentTime(startTime + currentSeconds);
    }
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    playerRef?.current?.pause();
  }

  function play() {
    playerRef?.current?.play()?.catch(console.error);
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
        transform: `scale(${width / clipWidth}, ${height / clipHeight})`,
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
        <div data-vjs-player>
          <div ref={videoRef} />
        </div>
      </div>
    </div>
  );
}
