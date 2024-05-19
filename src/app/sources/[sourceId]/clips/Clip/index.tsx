'use client';
import Timeline from "../../timeline";
import Video from "../../video";
import { useTimer } from "../../useTimer";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Transformer, Rect } from 'react-konva';

type Schema = {
  range: {
    start: number;
    end: number;
  } | undefined,
  sections: [
    {
      start: number,
      end: number,
      display?: Display,
    },
  ],
}

const Displays = {
  One: {
    name: 'One',
    //image: '/public/images/displays/one.png',
    elements: [
      {
        x: 10,
        y: 30,
        width: 270,
        height: 480,
      },
    ],
  },
  TwoVertical: {
    name: 'Two Vertical',
    //image: '/public/images/displays/two-vertical.png',
    elements: [
      {
        x: 10,
        y: 30,
        width: 270,
        height: 240,
      },
      {
        x: 10,
        y: 270,
        width: 270,
        height: 240,
      },
    ],
  },
};

type Display = typeof Displays[keyof typeof Displays];
type DisplayKey = keyof typeof Displays;

export default function Clip({ source, start, end }: { source: any, start: number, end: number }) {
  const timer = useTimer(end - start);

  const [selectedSection, setSelectedSection] = useState<number>(0);
  const [selectedId, selectShape] = useState<string | null>(null);

  const form = useForm<Schema>({
    defaultValues: {
      range: {
        start,
        end,
      },
      sections: [
        {
          start: 0,
          end: end - start,
        },
      ],
    }
  });

  const display = form.watch(`sections`)[selectedSection]?.display;

  function onSubmit() { }

  function divideSection() {
    const sections = form.getValues().sections;

    timer.currentSeconds

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section && section.start <= timer.currentSeconds && timer.currentSeconds <= section.end) {
        const newSection = {
          start: timer.currentSeconds,
          end: section.end,
          elements: [] as any,
        };

        section.end = timer.currentSeconds;
        sections.splice(i + 1, 0, newSection);

        form.setValue('sections', sections);
        return;
      }
    }
  }

  function deleteSection() {
    const sections = form.getValues().sections;

    if (sections.length === 1)
      return;

    const section = sections[selectedSection];

    if (!section)
      return;

    if (selectedSection === 0) {
      //We put this instead of harcoding 1 because typescript complains.
      sections[selectedSection + 1]!.start = 0;
    } else {
      sections[selectedSection - 1]!.end = section.end;
    }

    sections.splice(selectedSection, 1);
    form.setValue('sections', sections);
  }

  const handleSelectDisplay = (newDisplay: Display) => {
    if(newDisplay.name === display?.name) 
      return;

    const sections = form.getValues().sections;
    const section = sections[selectedSection];

    if (!section)
      return;

    section.display = newDisplay;

    form.setValue('sections', sections);
  }

  const checkDeselect = (e: any) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-row"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="w-1/4 border border-1 border-black">
          <div className="p-4 border border-b-black">
            Displays
          </div>
          <div className="p-3 w-full flex flex-row justify-between flex-wrap">
            {(Object.keys(Displays) as any).map((key: DisplayKey) => (
              <div
                key={key}
                onClick={() => handleSelectDisplay(Displays[key])}
                className={`
                  flex flex-col justify-center items-center
                  w-[135px] h-[240px] border border-black cursor-pointer
                  ${display?.name === Displays[key].name && 'bg-gray-200'}
                `}>
                <span>{Displays[key].name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          <Stage
            width={960}
            height={540}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
          >

            <Layer>
              <Video
                src={`${source.url}`}
                timer={timer}
                startTime={start}
                overlay={!!display}
              />
              {display && (
                display.elements.map((element, i) => (
                  <Rectangle
                    key={i}
                    shapeProps={element}
                    isSelected={selectedId === i.toString()}
                    onSelect={() => {
                      selectShape(i.toString());
                    }}
                    onChange={(newAttrs) => {
                      display.elements[i] = newAttrs;
                      form.setValue('sections', form.watch('sections'));
                    }}
                  />
                ))
              )}
            </Layer>
          </Stage>

          <div className="flex flex-row gap-x-10 justify-center">
            <div className="flex flex-row gap-x-4">
              <button onClick={divideSection}>Divide Section</button>
              <button onClick={() => deleteSection()}>Delete Section</button>
            </div>
            <button onClick={() => timer.togglePlay()}>{timer.playing ? 'Stop' : 'Play'}</button>
          </div>
          {timer.length && (
            <Timeline
              length={timer.length}
              currentTime={timer.currentTime}
              setCurrentTime={(time: number) => timer.seek(time)}
            >
              {(timelineWidth: number, zoom: number, length: number) => (
                <SectionSelector
                  timelineWidth={timelineWidth}
                  zoom={zoom}
                  length={length}
                  sections={form.watch('sections')}
                  selectedSection={selectedSection}
                  setSelectedSection={setSelectedSection}
                />
              )}
            </Timeline>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function SectionSelector({
  timelineWidth,
  zoom,
  length,
  sections,
  selectedSection,
  setSelectedSection,
}: {
  timelineWidth: number,
  zoom: number,
  length: number,
  sections: Schema['sections']
  selectedSection: number,
  setSelectedSection: (start: number) => void,
}) {
  return (
    <div className="absolute w-full h-full">
      {sections.map((section, i) => (
        <Section
          key={i}
          section={section}
          selected={selectedSection === i}
          onClick={() => setSelectedSection(i)}
        />
      ))}
    </div>
  );

  function Section({
    section,
    selected,
    onClick,
  }: {
    section: Schema['sections'][0],
    selected: boolean,
    onClick: () => void,
  }) {
    const { start, end } = section;

    const left = start * timelineWidth * zoom / length;
    const width = (end - start) * timelineWidth * zoom / length;

    return (
      <div
        className={`absolute h-full border-2 border-gray-400 ${selected && 'bg-gray-200 opacity-50'}`}
        style={{ left, width }}
        onClick={onClick}
      >
      </div>
    );
  }
}

const Rectangle = ({
  shapeProps,
  isSelected,
  onSelect,
  onChange
}: {
  shapeProps: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
  isSelected: boolean,
  onSelect: () => void,
  onChange: (newShape: {
    x: number,
    y: number,
    width: number,
    height: number,
  }) => void,
}) => {
  const shapeRef = useRef<any>();
  const trRef = useRef<any>();

  useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        stroke={isSelected ? undefined : 'red'}
        draggable
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onMouseDown={onSelect}
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
      />
      {isSelected && (
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
      )}
    </>
  );
};
