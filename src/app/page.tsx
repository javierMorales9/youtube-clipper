'use client';

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image, Transformer, Group } from 'react-konva';

const initialRectangles = [
  {
    x: 10,
    y: 10,
    width: 100,
    height: 100,
    id: 'rect1',
  },
];

export default function Page() {
  const [rectangles, setRectangles] = useState(initialRectangles);
  const [selectedId, selectShape] = useState<string | null>(null);

  const videoRef = useRef<any>(null);

  const checkDeselect = (e: any) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <>
      <button onClick={() => {
        videoRef.current.play();
      }}>Play</button>
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {rectangles.map((rect, i) => {
            return (
              <Rectangle
                key={i}
                videoRef={videoRef}
                shapeProps={rect}
                isSelected={rect.id === selectedId}
                onSelect={() => {
                  selectShape(rect.id);
                }}
                onChange={(newAttrs: any) => {
                  const rects = rectangles.slice();
                  rects[i] = newAttrs;
                  setRectangles(rects);
                }}
              />
            );
          })}
        </Layer>
      </Stage>
      <video ref={videoRef} hidden />
    </>
  );
}

function Rectangle({
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  videoRef,
}: {
  shapeProps: any;
  isSelected: any;
  onSelect: any;
  onChange: any;
  videoRef: any;
}) {
  const trRef = useRef<any>();
  const [videoNode, setVideoNode] = useState<any>();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.src = "test.mp4";

      // Konva animation frame
      const animate = () => {
        if (video.paused || video.ended) {
          return;
        }
        videoNode?.getLayer().batchDraw();
        requestAnimationFrame(animate);
      };

      video.addEventListener("loadeddata", () => {
        video.play();
        animate();
      });
    }
  }, [videoNode]);

  useEffect(() => {
    if (isSelected) {
      trRef.current.nodes([videoNode]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        onClick={onSelect}
        onTap={onSelect}
        draggable
        clipX={100}
        clipY={100}
        clipWidth={200}
        clipHeight={200}
        width={100}
        height={100}
        onDragEnd={(e) => {
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
          //const node = imgRef.current;
          const scaleX = videoNode.scaleX();
          const scaleY = videoNode.scaleY();

          // we will reset it back
          videoNode.scaleX(1);
          videoNode.scaleY(1);
          onChange({
            ...shapeProps,
            x: videoNode.x(),
            y: videoNode.y(),
            // set minimal value
            width: Math.max(5, videoNode.width() * scaleX),
            height: Math.max(videoNode.height() * scaleY),
          });
        }}
      >
        <Image
          ref={(node) => {
            setVideoNode(node);
          }}
          width={640}
          height={360}
          image={videoRef.current}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          rotateEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
