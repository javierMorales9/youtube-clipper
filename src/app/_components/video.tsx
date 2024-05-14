'use client';
import { useEffect, useRef, useState } from 'react';
import Timeline from '@/app/_components/timeline';

export default function Video({src}: {src: string}) {
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [movie, setMovie] = useState<HTMLVideoElement | null>(null);

  const [timer, setTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return

    const video = document.createElement('video');
    video.src = src;
    video.controls = false;
    video.autoplay = false;

    const context = canvas.getContext('2d');
    if (!context) return;

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    video.addEventListener('play', function() {
      const $this = this;
      (function loop() {
        if (!$this.paused && !$this.ended) {
          context.drawImage($this, 0, 0);
          setTimeout(loop, 1000 / 30);
        }
      })();

    });

    setMovie(video);
  }, []);

  function togglePlay() {
    if (playing) {
      clearInterval(timer!);
      setTimer(null);
      setPlaying(false);

      movie?.pause();
    }
    else {
      const t = setInterval(() => {
        if(movie)
          setCurrentTime(ct => increaseTime(ct));
      }, 1000);
      setTimer(t);
      setPlaying(true);

      movie?.play().catch(console.error);
    }
  }

  function increaseTime(time: [number, number]): [number, number] {
    const [minutes, seconds] = time;
    if (seconds === 59) {
      if (minutes === movie!.duration) {
        clearInterval(timer!);
        setTimer(null);
        setPlaying(false);
        return [0, 0];
      }
      return [minutes + 1, 0];
    }
    return [minutes, seconds + 1];
  }

  function formatTime(time: number): [number, number] {
    return [Math.floor(time / 60), Math.floor(time % 60)];
  }

  function seek(time: number) {
    setCurrentTime(formatTime(time));
    movie!.currentTime = time;
  }

  return (
    <div>
      <div className="w-full flex justify-center items-center">
        <canvas ref={canvasRef} width={1280} height={720} className="w-[960px] h-[540px]"></canvas>
        <button onClick={() => togglePlay()}>{playing ? 'Stop' : 'Play'}</button>
      </div>
      {movie &&
        <Timeline
          length={movie.duration}
          currentTime={currentTime}
          setCurrentTime={(time: number) => seek(time)}
        />
      }
    </div>
  );
}

