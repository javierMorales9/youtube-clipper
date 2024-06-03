'use client';
import { useEffect, useRef, useState } from 'react';
import { Timer } from '../../useTimer';
import { Image } from 'react-konva';
import Konva from 'konva';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

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
  dimensions,
  setDimensions,
}: {
  src: string,
  startTime: number,
  timer: Timer,
  dimensions: [number, number],
  setDimensions: (dim: [number, number]) => void
}) {
  const playerRef = useRef<Player | null>(null);

  const [videoTimer, setVideoTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [videoNode, setVideoNode] = useState<Konva.Image | null>();

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      videoElement.style.display = 'none';
      document.body.appendChild(videoElement);

      const player = playerRef.current = videojs(
        videoElement,
        {
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
          player.on('loadedmetadata', () => {
            if (!length)
              setLength(player.duration()!);

            console.log('tu puta', player.videoWidth(), player.videoHeight());
            setDimensions([player.videoWidth(), player.videoHeight()]);
          });
        }
      );
    }
  }, []);

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

    if (Math.abs(currentSeconds + startTime - movie.currentTime()!) < 1)
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
    clearInterval(videoTimer!);
    setVideoTimer(null);

    playerRef.current?.pause();
  }

  function play() {
    const movie = playerRef.current;

    const vidT = setInterval(() => {
      if (!movie) return;
      videoNode?.getLayer()?.batchDraw();
    }, 1000 / 30);


    setVideoTimer(vidT);

    movie?.play()?.catch(console.error);
  }

  return (
    <>
      {playerRef.current && (
        <Image
          ref={(node) => {
            setVideoNode(node);
          }}
          width={dimensions[0]}
          height={dimensions[1]}
          image={playerRef.current?.el().querySelector('video') as any}
        />
      )}
    </>
  );
}

