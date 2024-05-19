'use client';
import Timeline from "../../timeline";
import Video from "../../video";
import { useTimer } from "../../useTimer";
import { useForm, FormProvider } from "react-hook-form";
import { useState } from "react";
import { Stage, Layer, Image, Transformer, Group } from 'react-konva';

type Schema = {
  range: {
    start: number;
    end: number;
  } | undefined,
  sections: [
    {
      start: number,
      end: number,
      elements: [
        {
          x: number,
          y: number,
          width: number,
          height: number,
        },
      ],
    },
  ],
}

const Displays = {
  One: {
    name: 'One',
    //image: '/public/images/displays/one.png',
    elements: [
      {
        width: 1080,
        height: 1920,
      },
    ],
  },
  TwoVertical: {
    name: 'Two Vertical',
    //image: '/public/images/displays/two-vertical.png',
    elements: [
      {
        width: 270,
        height: 480,
      },
      {
        width: 270,
        height: 480,
      },
    ],
  },
} as const;

export default function Clip({ source, start, end }: { source: any, start: number, end: number }) {
  const timer = useTimer(end - start);

  const [selectedSectionStart, setSelectedSectionStart] = useState<number>(0);
  const [display, setDisplay] = useState<typeof Displays[keyof typeof Displays] | null>(null);

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
          elements: [],
        },
      ],
    }
  });

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

  function deleteSection(start: number) {
    const sections = form.getValues().sections;

    if (sections.length === 1)
      return;

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      if (section && section.start === start) {
        if (i === 0) {
          //We put this instead of harcoding 1 because typescript will complain
          sections[i + 1]!.start = 0;
        } else {
          sections[i - 1]!.end = section.end;
        }

        sections.splice(i, 1);
        form.setValue('sections', sections);
        return;
      }
    }
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
          {!display && (
            <>
              <div className="p-4 border border-b-black">
                Displays
              </div>
              <div className="p-3 w-full flex flex-row justify-between flex-wrap">
                {(Object.keys(Displays) as any).map((key: keyof typeof Displays) => (
                  <div
                    key={key}
                    onClick={() => setDisplay(Displays[key])}
                    className="flex flex-col justify-center items-center w-[135px] h-[240px] border border-black cursor-pointer">
                    <span>{Displays[key].name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {display && (
            <>
              <div
                className="cursor-pointer p-4"
                onClick={() => setDisplay(null)}
              >
                {'<-'} Select other display
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center w-full">
          <Stage
            width={960}
            height={540}
          //onMouseDown={checkDeselect}
          //onTouchStart={checkDeselect}
          >

            <Layer>
              <Video
                src={`${source.url}`}
                timer={timer}
                startTime={start}
              />
            </Layer>
          </Stage>

          <div className="flex flex-row gap-x-10 justify-center">
            <div className="flex flex-row gap-x-4">
              <button onClick={divideSection}>Divide Section</button>
              <button onClick={() => deleteSection(selectedSectionStart)}>Delete Section</button>
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
                  selectedSectionStart={selectedSectionStart}
                  setSelectedSectionStart={setSelectedSectionStart}
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
  selectedSectionStart,
  setSelectedSectionStart,
}: {
  timelineWidth: number,
  zoom: number,
  length: number,
  sections: Schema['sections']
  selectedSectionStart: number,
  setSelectedSectionStart: (start: number) => void,
}) {
  return (
    <div className="absolute w-full h-full">
      {sections.map((section, i) => (
        <Section
          key={i}
          section={section}
          selected={section.start === selectedSectionStart}
          onClick={() => setSelectedSectionStart(section.start)}
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
        className={`absolute h-full border border-2 border-gray-400 ${selected && 'bg-gray-200 opacity-50'}`}
        style={{ left, width }}
        onClick={onClick}
      >
      </div>
    );
  }
}
