'use client';
import { useEffect, useState } from 'react';
import { Timer } from '../../useTimer';
import { Image } from 'react-konva';

export default function Video({
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
  width: number,
  height: number,
}) {
  const [movie, setMovie] = useState<HTMLVideoElement | null>(null);
  const [videoTimer, setVideoTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [videoNode, setVideoNode] = useState<any>();

  useEffect(() => {
    const video = document.createElement('video');
    video.src = src;
    video.controls = false;
    video.autoplay = false;

    if (startTime)
      video.currentTime = startTime;
    else
      video.currentTime = 0;

    video.onloadedmetadata = () => {
      if (!length) {
        setLength(video.duration);
      }
    }

    setMovie(video);
  }, []);

  useEffect(() => {
    if (!movie) return;

    if(Math.abs(currentSeconds + startTime - movie.currentTime) < 1)
      return;

    console.log('setting time', movie.currentTime, currentSeconds);
    movie.currentTime = startTime + currentSeconds;
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    clearInterval(videoTimer!);
    setVideoTimer(null);

    movie?.pause();
  }

  function play() {
    const vidT = setInterval(() => {
      if (!movie) return;
      videoNode?.getLayer().batchDraw();
    }, 1000 / 30);


    setVideoTimer(vidT);

    movie?.play().catch(console.error);
  }

  return (
    <Image
      ref={(node) => {
        setVideoNode(node);
      }}
      width={width}
      height={height}
      image={movie!}
    />
  );
}

