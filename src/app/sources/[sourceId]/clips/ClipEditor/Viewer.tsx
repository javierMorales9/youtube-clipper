import { Timer } from "../../useTimer";
import { useEffect, useRef } from "react";
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import Konva from "konva";
import HLSReproducer from "../../HLSReproducer";
import { SectionType } from "@/server/entities/clip/domain/Clip";

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
  section?: SectionType
  dimensions: [number, number],
  setDimensions: (dim: [number, number]) => void
  modifyFragment: (
    index: number,
    fragment: {
      x: number,
      y: number,
      width: number,
      height: number
    }
  ) => void
}) {
  const factor = 400 / 480
  //const factor = 1;

  return (
    <div className="relative">
      <div className="absolute top-0 left-0">
        <HLSReproducer
          src={source}
          timer={timer}
          startTime={start}
          width={dimensions[0] * factor}
          height={dimensions[1] * factor}
          setDimensions={setDimensions}
        />
      </div>
      <Stage
        width={dimensions[0] * factor}
        height={dimensions[1] * factor}
      >
        <Layer>
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
          if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </>
  );
};

