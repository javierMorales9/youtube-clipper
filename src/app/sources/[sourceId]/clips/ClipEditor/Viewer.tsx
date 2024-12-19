import { Timer } from "../../useTimer";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import { SectionFront } from "../Clip";
import Konva from "konva";
import { Image } from 'react-konva';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

export function Viewer({
  source,
  start,
  timer,
  section,
  dimensions,
  setDimensions,
  modifyFragment,
}: {
  source: string,
  start: number,
  timer: Timer,
  section?: SectionFront
  dimensions: [number, number],
  setDimensions: (dim: [number, number]) => void
  modifyFragment: (index: number, fragment: { x: number, y: number, width: number, height: number }) => void
}) {
  const factor = 400 / 480

  const stageRef = useRef<Konva.Stage | null>(null);

  return (
    <Stage
      ref={stageRef}
      width={dimensions[0] * factor}
      height={dimensions[1] * factor}
    >
      <Layer>
        <Video
          src={`${source}`}
          timer={timer}
          startTime={start}
          dimensions={[dimensions[0] * factor, dimensions[1] * factor]}
          setDimensions={setDimensions}
        />
        {section?.fragments && (
          section?.fragments.map((element, i) => (
            <Rectangle
              key={i}
              shapeProps={{
                x: element.x * factor,
                y: element.y * factor,
                width: element.width * factor,
                height: element.height * factor,
              }}
              stageWidth={dimensions[0] * factor}
              stageHeight={dimensions[1] * factor}
              onChange={(newAttrs) => {
                modifyFragment(i, {
                  x: newAttrs.x / factor,
                  y: newAttrs.y / factor,
                  width: newAttrs.width / factor,
                  height: newAttrs.height / factor,
                })
              }}
            />
          ))
        )}
      </Layer>
    </Stage>
  );
}

function Video({
  src,
  startTime = 0,
  timer: {
    length,
    setLength,
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
            src,
            type: 'application/x-mpegURL'
          }],
        },
        () => {
          player.on('loadedmetadata', () => {
            if (!length)
              setLength(player.duration()!);

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
    if (!videoNode) return;

    console.log('start', videoNode, playerRef.current);
    playerRef.current?.currentTime(startTime + currentSeconds);
    videoNode.getLayer()?.batchDraw();
  }, [videoNode]);

  useEffect(() => {
    const movie = playerRef.current;
    if (!movie) return;

    if (Math.abs(currentSeconds + startTime - movie.currentTime()!) < 1)
      return;

    movie.currentTime(startTime + currentSeconds);
  }, [currentSeconds]);

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

const Rectangle = ({
  stageWidth,
  stageHeight,
  shapeProps,
  onChange,
}: {
  stageWidth: number,
  stageHeight: number,
  shapeProps: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
  onChange: (newShape: {
    x: number,
    y: number,
    width: number,
    height: number,
  }) => void,
}) => {
  const shapeRef = useRef<Konva.Rect | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    const shapes = [];
    if (shapeRef.current)
      shapes.push(shapeRef.current);

    trRef.current?.nodes(shapes);
    trRef.current?.getLayer()?.batchDraw();
  }, []);

  return (
    <>
      <Rect
        ref={shapeRef}
        {...shapeProps}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onMouseUp={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          if (!node) return;

          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
          });
        }}
        onDragMove={() => {
          const node = shapeRef.current;
          if (!node) return;

          const box = node.getClientRect();

          const absPos = node.getAbsolutePosition();
          const offsetX = box.x - absPos.x;
          const offsetY = box.y - absPos.y;

          const newAbsPos = { ...absPos };
          if (box.x < 0) {
            newAbsPos.x = -offsetX;
          }
          if (box.y < 0) {
            newAbsPos.y = -offsetY;
          }
          if (box.x + box.width > stageWidth) {
            newAbsPos.x = stageWidth - box.width - offsetX;
          }
          if (box.y + box.height > stageHeight) {
            newAbsPos.y = stageHeight - box.height - offsetY;
          }

          node.setAbsolutePosition(newAbsPos);
        }}
      />
      <Transformer
        ref={trRef}
        flipEnabled={false}
        rotateEnabled={false}
        resizeEnabled={true}
        enabledAnchors={[
          'top-left',
          'top-right',
          'bottom-left',
          'bottom-right',
        ]}
        boundBoxFunc={(oldBox, newBox) => {
          // limit resize
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </>
  );
};

