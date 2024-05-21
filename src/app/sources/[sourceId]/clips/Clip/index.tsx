'use client';
import Timeline from "../../timeline";
import Video from "./video";
import { Timer, useTimer } from "../../useTimer";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import VideoFragment from "./videoFragment";

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
      fragments?: {
        x: number,
        y: number,
        width: number,
        height: number,
      }[],
    },
  ],
}

type Section = Schema['sections'][0];

const Displays = {
  One: {
    name: 'One',
    //image: '/public/images/displays/one.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 480,
      },
    ],
  },
  TwoColumn: {
    name: 'Two Column',
    //image: '/public/images/displays/two-column.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 270,
        height: 240,
      },
      {
        x: 0,
        y: 240,
        width: 270,
        height: 240,
      },
    ],
  },
  TwoRow: {
    name: 'Two Row',
    //image: '/public/images/displays/two-row.png',
    elements: [
      {
        x: 0,
        y: 0,
        width: 135,
        height: 480,
      },
      {
        x: 135,
        y: 0,
        width: 135,
        height: 480,
      },
    ],
  },
};

type DisplayKey = keyof typeof Displays;
type Display = typeof Displays[DisplayKey];

export default function Clip({ source, start, end }: { source: any, start: number, end: number }) {
  const timer = useTimer(end - start);
  const [showModal, setShowModal] = useState(false);

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
          display: Displays.One,
          fragments: [
            ...Displays.One.elements,
          ]
        },
      ],
    }
  });

  const {
    section,
    selectedSection,
    setSelectedSection,
    divideSection,
    deleteSection
  } = useSections(timer, form);

  function onSubmit() { }

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-row"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="w-1/4 border border-1 border-black">
          <DisplaysSelector
            section={section}
            form={form}
          />
        </div>
        <div className="flex flex-col items-center w-full">
          <button onClick={() => setShowModal(!showModal)}>Clip</button>
          <Preview
            section={section}
            source={source}
            timer={timer}
            startTime={start}
          />

          <div className="flex flex-row gap-x-10 justify-center">
            <Controls
              timer={timer}
              divideSection={divideSection}
              deleteSection={deleteSection}
            />
          </div>
          {timer.length && (
            <Timeline
              length={timer.length}
              currentTime={timer.currentTime}
              currentSeconds={timer.currentSeconds}
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
        <div
          className={`
            fixed top-0 left-0 w-full h-full
            ${showModal ? 'flex' : 'hidden'}
            justify-center items-center
            bg-black bg-opacity-80
          `}
          onClick={() => setShowModal(false)}
        >
          <div onClick={(e) => {
            e.stopPropagation();
          }}>
            <Viewer
              source={source.url}
              start={start}
              timer={timer}
              section={section}
              form={form}
            />
          </div>
        </div>
      </form>
    </FormProvider >
  );
}

function DisplaysSelector({
  section,
  form
}: {
  section?: Section,
  form: UseFormReturn<Schema, null, undefined>
}) {
  const handleSelectDisplay = (newDisplay: Display) => {
    if (!section || newDisplay.name === section.display?.name)
      return;

    section.display = newDisplay;
    section.fragments = newDisplay.elements.map((element, i) => ({
      ...element,
    }));

    form.setValue('sections', form.getValues('sections'));
  }

  return (
    <>
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
              border border-black cursor-pointer
              ${section?.display?.name === Displays[key].name && 'bg-gray-200'}
           `}
          >
            <span>{Displays[key].name}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function useSections(timer: Timer, form: UseFormReturn<Schema, null, undefined>) {
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const section = form.watch('sections')[selectedSection];

  useEffect(() => {
    const sections = form.getValues().sections;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section && section.start <= timer.currentSeconds && timer.currentSeconds <= section.end) {
        setSelectedSection(i);
        return;
      }
    }
  }, [timer.currentTime]);

  function divideSection() {
    const sections = form.getValues().sections;

    timer.currentSeconds

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section && section.start <= timer.currentSeconds && timer.currentSeconds <= section.end) {
        const newSection = {
          ...section,
          start: timer.currentSeconds,
        };
        section.end = timer.currentSeconds;

        //we add a new section after the current one.
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

  return { section, selectedSection, setSelectedSection, divideSection, deleteSection };
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
    section: Section,
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

function Viewer({
  source,
  start,
  timer,
  section,
  form,
  width = 960,
  height = 540,
}: {
  source: string,
  start: number,
  timer: Timer,
  section?: Section
  form: UseFormReturn<Schema, null, undefined>,
  width?: number,
  height?: number,
}) {
  return (
    <Stage
      width={width}
      height={height}
    >
      <Layer>
        <Video
          src={`${source}`}
          timer={timer}
          startTime={start}
          width={width}
          height={height}
        />
        {section?.fragments && (
          section?.fragments.map((element, i) => (
            <Rectangle
              key={i}
              shapeProps={element}
              stageWidth={width}
              stageHeight={height}
              onChange={(newAttrs) => {
                if (!section?.fragments || !section?.fragments[i])
                  return;

                section.fragments[i] = newAttrs;
                form.setValue('sections', form.watch('sections'));
              }}
            />
          ))
        )}
      </Layer>
    </Stage>
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
  const shapeRef = useRef<any>();
  const trRef = useRef<any>();

  useEffect(() => {
    trRef.current.nodes([shapeRef.current]);
    trRef.current.getLayer().batchDraw();
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

function Controls({
  timer,
  divideSection,
  deleteSection
}: {
  timer: Timer,
  divideSection: () => void,
  deleteSection: () => void
}) {

  return (
    <>
      <div className="flex flex-row gap-x-4">
        <button onClick={divideSection}>Divide Section</button>
        <button onClick={deleteSection}>Delete Section</button>
      </div>
      <button onClick={timer.togglePlay}>{timer.playing ? 'Stop' : 'Play'}</button>
    </>
  );
}

function Preview({
  section,
  source,
  timer,
  startTime
}: {
  section?: Section,
  source: any,
  timer: Timer,
  startTime: number
}) {
  return (
    <div className="relative w-[270px] h-[480px]">
      {section && section.fragments && section.fragments.map((element, i, elements) => (
        <VideoFragment
          src={source.url}
          timer={timer}
          startTime={startTime}
          x={section.display!.elements[i]!.x}
          y={section.display!.elements[i]!.y}
          width={section.display!.elements[i]!.width}
          height={section.display!.elements[i]!.height}
          clip={{
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          }}
          positionOffset={elements[i - 1] ? elements[i - 1]!.height : 0}
        />
      ))}
    </div>
  );
}
