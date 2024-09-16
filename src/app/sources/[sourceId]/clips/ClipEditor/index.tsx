'use client';
import Timeline from "../../Timeline";
import Video from "./video";
import { Timer, useTimer } from "../../useTimer";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Transformer, Rect } from 'react-konva';
import { Source } from "@/server/db/schema";
import Konva from "konva";
import { api } from "@/trpc/react";
import { Clip, Display, Section } from "../Clip";
import { Displays, DisplayKey } from "../Displays";
import Link from "next/link";
import Back from "../../../../../../public/images/Back.svg";
import Play from "../../../../../../public/images/MaterialSymbolsPlayArrow.svg";
import Split from "../../../../../../public/images/Split.svg";
import Trash from "../../../../../../public/images/Trash.svg";
import Pause from "../../../../../../public/images/Pause.svg";
import { toReadableTime } from "@/app/utils";
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Player from 'video.js/dist/types/player';

export default function ClipEditor({
  source,
  timelineUrl,
  clip,
}: {
  source: Source,
  timelineUrl: string,
  clip: Clip,
}) {
  const { start, end } = clip.range;
  const timer = useTimer(end - start);
  const [showModal, setShowModal] = useState(false);

  const { mutateAsync: createClip } = api.clip.create.useMutation();

  const [dimensions, setDimensions] = useState<[number, number]>([0, 0]);

  const handleDimensionsUpdate = (newDim: [number, number]) => {
    const height = 480;
    const multiplier = height / newDim[1];
    const newW = newDim[0] * multiplier;

    setDimensions([newW, height]);
  }

  const form = useForm<Clip>({
    defaultValues: clip,
  });

  useEffect(() => {
    form.setValue("width", dimensions[0]);
    form.setValue("height", dimensions[1]);
  }, [dimensions]);


  const {
    section,
    selectedSection,
    setSelectedSection,
    divideSection,
    deleteSection,
    handleSelectDisplay
  } = useSections(timer, form);

  async function onSubmit() {
    const data = form.getValues();

    await createClip({
      name: data.name,
      sourceId: source.id,
      id: clip.clipId,
      range: data.range,
      width: data.width,
      height: data.height,
      sections: data.sections.map((section) => ({
        start: section.start,
        end: section.end,
        display: section.display!.name,
        fragments: section.fragments!,
      }))
    });
  }

  return (
    <FormProvider {...form}>
      <form className="flex flex-col" onSubmit={(e) => { e.preventDefault(); }}>
        <div className="flex flex-row">
          <div className="w-1/3 h-[450px] flex flex-col gap-y-2">
            <Link
              href={`/sources/${source.id}`}
              className="flex flex-row items-center gap-x-2 text-gray-600"
            >
              <Back className="fill-gray-600 w-6 h-6 " />
              <span
                className="text-lg font-semibold"
              >
                Go back
              </span>
            </Link>
            <div className="flex flex-col">
              <label htmlFor="file">Clip name</label>
              <input
                type="text"
                className="border border-gray-200 rounded-lg p-2"
                {...form.register('name')}
              />
            </div>
            <DisplaysSelector
              section={section}
              handleSelectDisplay={handleSelectDisplay}
            />
          </div>
          <div className="w-full flex flex-col items-center justify-center">
            <button onClick={() => setShowModal(!showModal)}>Preview</button>
            <Viewer
              source={source.url!}
              start={start}
              timer={timer}
              section={section}
              form={form}
              dimensions={dimensions}
              setDimensions={handleDimensionsUpdate}
            />
          </div>
        </div>
        <div className="flex flex-col items-center w-full">
          {timer.length && (
            <div className="flex flex-col w-full items-center">
              <Timeline
                length={timer.length}
                imageUrl={timelineUrl}
                source={source}
                currentSeconds={timer.currentSeconds}
                setCurrentTime={(time: number) => timer.seek(time)}
                offset={start}
                sourceLength={source.duration!}
                controls={(zoomBar) => (
                  <div className="w-full flex flex-row gap-x-10 justify-center">
                    <Controls
                      timer={timer}
                      divideSection={divideSection}
                      deleteSection={deleteSection}
                      createClip={onSubmit}
                      zoomBar={zoomBar}
                    />
                  </div>
                )}
              >
                {(
                  visibleTimelineWidth: number,
                  timelineSeconds: number,
                  initialPosition: number,
                  initialSeconds: number
                ) => (
                  <SectionSelector
                    visibleTimelineWidth={visibleTimelineWidth}
                    timelineSeconds={timelineSeconds}
                    initialPosition={initialPosition}
                    initialSeconds={initialSeconds}
                    sections={form.watch('sections')}
                    selectedSection={selectedSection}
                    setSelectedSection={setSelectedSection}
                  />
                )}
              </Timeline>
            </div>
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
            <Preview
              section={section}
              source={source}
              timer={timer}
              startTime={start}
              dimensions={dimensions}
            />
          </div>
        </div>
      </form>
    </FormProvider >
  );
}

function DisplaysSelector({
  section,
  handleSelectDisplay,
}: {
  section?: Section,
  handleSelectDisplay: (newDisplay: Display) => void,
}) {
  return (
    <div className="bg-white h-full rounded border border-gray-100 overflow-y-scroll">
      <div className="p-4 text-xl font-bold">
        Displays
      </div>
      <div className="p-3 w-full flex flex-wrap flex-row justify-between">
        {(Object.keys(Displays) as DisplayKey[]).map((key) => (
          <div
            key={key}
            onClick={() => handleSelectDisplay(Displays[key])}
            className={`
              flex flex-col justify-center items-center cursor-pointer
           `}
          >
            <span
              className={
                `w-full flex justify-center
                ${section?.display?.name === Displays[key].name && 'bg-gray-200'}
              `}
            >
              {Displays[key].name}
            </span>

            <img
              className="w-20"
              src={Displays[key].image} alt={Displays[key].name}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function useSections(timer: Timer, form: UseFormReturn<Clip, null, undefined>) {
  const [selectedSection, setSelectedSection] = useState<number>(0);
  const section = form.watch('sections')[selectedSection];

  useEffect(() => {
    const range = form.getValues().range;

    if (!form.getValues().sections.length) {
      form.setValue('sections', [{
        start: 0,
        end: range.end - range.start,
        display: Displays.One,
        fragments: [
          {
            x: 0,
            y: 0,
            width: 270,
            height: 480,
          }
        ],
      }]);
    }
  }, [])

  useEffect(() => {
    const sections = form.getValues().sections;
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (section
        && section.start <= timer.currentSeconds
        && timer.currentSeconds <= section.end
      ) {
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
      if (section
        && section.start <= timer.currentSeconds
        && timer.currentSeconds <= section.end
      ) {
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

  const handleSelectDisplay = (newDisplay: Display) => {
    if (!section || newDisplay.name === section.display?.name)
      return;

    section.display = newDisplay;
    section.fragments = newDisplay.elements.map((element, i) => ({
      x: element.x,
      y: element.y,
      width: element.width / 2,
      height: element.height / 2,
    }));

    form.setValue('sections', form.getValues('sections'));
  }

  return {
    section,
    selectedSection,
    setSelectedSection,
    divideSection,
    deleteSection,
    handleSelectDisplay
  };
}

function SectionSelector({
  visibleTimelineWidth,
  timelineSeconds,
  initialPosition,
  initialSeconds,
  sections,
  selectedSection,
  setSelectedSection,
}: {
  visibleTimelineWidth: number,
  timelineSeconds: number,
  initialPosition: number,
  initialSeconds: number
  sections: Clip['sections']
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

    const left = (start - initialSeconds) * visibleTimelineWidth / timelineSeconds + initialPosition;
    const width = (end - start) * visibleTimelineWidth / timelineSeconds;

    return (
      <div
        className={`
          absolute h-full border-2 border-gray-400
          ${selected && 'bg-gray-200 opacity-50'}
        `}
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
  dimensions,
  setDimensions,
}: {
  source: string,
  start: number,
  timer: Timer,
  section?: Section
  form: UseFormReturn<Clip, null, undefined>,
  dimensions: [number, number],
  setDimensions: (dim: [number, number]) => void
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
                if (!section?.fragments || !section?.fragments[i])
                  return;

                section.fragments[i] = {
                  x: newAttrs.x / factor,
                  y: newAttrs.y / factor,
                  width: newAttrs.width / factor,
                  height: newAttrs.height / factor,
                };
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

function Controls({
  timer,
  divideSection,
  deleteSection,
  createClip,
  zoomBar,
}: {
  timer: Timer,
  divideSection: () => void,
  deleteSection: () => void
  createClip: () => void,
  zoomBar?: JSX.Element,
}) {

  return (
    <>
      <div className="relative p-4 flex flex-row justify-between w-full gap-x-4">
        <div className="flex flex-row justify-center items-center gap-x-4">
          {zoomBar}
          <button onClick={divideSection}>
            <Split className="w-7 h-7 " />
          </button>
          <button onClick={deleteSection}>
            <Trash className="w-7 h-7" />
          </button>
        </div>
        <div className="flex flex-row items-center gap-x-4">
          <div className="flex flex-row gap-x-2">
            <button onClick={() => timer.togglePlay()}>
              {timer.playing ?
                <Pause className="w-7 h-7 fill-none stroke-gray-700" /> :
                <Play className="w-7 h-7 fill-none stroke-gray-700" />
              }
            </button>
            <div>{toReadableTime(timer.currentSeconds)}</div>
          </div>
        </div>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={createClip}
        >
          Save
        </button>
      </div>
    </>
  );
}

function Preview({
  section,
  source,
  timer,
  startTime,
  dimensions,
}: {
  section?: Section,
  source: Source,
  timer: Timer,
  startTime: number
  dimensions: [number, number],
}) {

  const factor = 440 / 480

  return (
    <div
      className="relative"
      style={{
        width: 270 * factor,
        height: 480 * factor,
      }}
    >
      {section && section.fragments && section.fragments.map((element, i) => (
        <VideoFragment
          key={i}
          src={`${source.url!}`}
          timer={timer}
          startTime={startTime}
          dimensions={[dimensions[0] * factor, dimensions[1] * factor]}
          x={section.display!.elements[i]!.x * factor}
          y={section.display!.elements[i]!.y * factor}
          width={section.display!.elements[i]!.width * factor}
          height={section.display!.elements[i]!.height * factor}
          clip={{
            x: element.x * factor,
            y: element.y * factor,
            width: element.width * factor,
            height: element.height * factor,
          }}
        />
      ))}
    </div>
  );
}

function VideoFragment({
  src,
  startTime = 0,
  timer: {
    currentTime,
    playing,
    currentSeconds
  },
  dimensions,
  x,
  y,
  width,
  height,
  clip: {
    x: clipX,
    y: clipY,
    width: clipWidth,
    height: clipHeight,
  },
}: {
  src: string,
  startTime: number,
  timer: Timer,
  dimensions: [number, number],
  x: number,
  y: number,
  width: number,
  height: number,
  clip: {
    x: number,
    y: number,
    width: number,
    height: number,
  },
}) {
  const videoRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playerRef.current) {
      const videoElement = document.createElement("video-js");

      videoElement.classList.add('vjs-big-play-centered');
      video.appendChild(videoElement);

      playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: false,
        responsive: true,
        muted: true,
        fluid: true,
        sources: [{
          src,
          type: 'application/x-mpegURL'
        }],
      },
        () => {
          videojs.log('player is ready');
        }
      );
    }
  }, [videoRef]);

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

    movie.width(dimensions[0]);
    movie.height(dimensions[1]);
  }, [dimensions]);

  useEffect(() => {
    const movie = playerRef.current;
    if (movie) {
      movie.currentTime(startTime + currentSeconds);
    }
  }, [currentTime]);

  useEffect(() => {
    if (playing)
      play();
    else
      pause();
  }, [playing]);

  function pause() {
    playerRef?.current?.pause();
  }

  function play() {
    playerRef?.current?.play()?.catch(console.error);
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: clipWidth,
        height: clipHeight,
        transformOrigin: 'left top',
        transform: `scale(${width / clipWidth}, ${height / clipHeight})`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: dimensions[0],
          height: dimensions[1],
          left: -clipX,
          top: -clipY,
        }}
      >
        <div data-vjs-player>
          <div ref={videoRef} />
        </div>
      </div>
    </div>
  );
}
