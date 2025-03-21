import { Timer } from "@/app/_components/useTimer";
import { useEffect, useMemo, useRef } from "react";
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import Konva from "konva";
import HLSReproducer from "@/app/_components/HLSReproducer";
import { SectionType } from "@/server/entities/clip/domain/Clip";
import { Displays } from "./Displays";

export function Viewer({
  source,
  start,
  timer,
  section,
  dimensions,
  modifyFragment,
}: {
  source: string,
  start: number,
  timer: Timer,
  section?: SectionType
  dimensions: [number, number],
  modifyFragment: (
    index: number,
    fragment: {
      x: number,
      y: number,
      size: number,
    },
  ) => void
}) {
  const defaultHeight = 400;
  const width = useMemo(() => defaultHeight * dimensions[0] / dimensions[1], []);
  const height = useMemo(() => defaultHeight, []);

  return (
    <div className="w-full">
      <div className="relative flex justify-center">
        <div className="absolute">
          <HLSReproducer
            src={source}
            timer={timer}
            startTime={start}
            height={height}
          />
        </div>
        <Stage
          width={width}
          height={height}
        >
          <Layer>
            {section?.fragments && (
              section?.fragments.map((fragment, i) => {
                const displayWidth = Displays[section.display][i]!.width;
                const displayHeight = Displays[section.display][i]!.height;

                const clipAspectRatio = (1080 * displayWidth) / (1920 * displayHeight);
                return (
                  <Rectangle
                    key={i}
                    shapeProps={{
                      x: fragment.x * width,
                      y: fragment.y * height,
                      width: height * clipAspectRatio * fragment.size,
                      height: height * fragment.size,
                    }}
                    stageWidth={width}
                    stageHeight={height}
                    onChange={(newAttrs) => {
                      modifyFragment(i, {
                        x: newAttrs.x / width,
                        y: newAttrs.y / height,
                        size: newAttrs.height / height,
                      })
                    }}
                  />
                )
              })
            )}
          </Layer>
        </Stage>
      </div>
    </div>
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
          if (newBox.x < 0) {
            return oldBox;
          }
          if (newBox.y < 0) {
            return oldBox;
          }
          if (newBox.x + newBox.width > stageWidth) {
            return oldBox;
          }
          if (newBox.y + newBox.height > stageHeight) {
            return oldBox
          }
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
            return oldBox;
          }

          return newBox;
        }}
      />
    </>
  );
};

