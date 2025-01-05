'use client';

import { useTimer } from "../../useTimer";
import { useForm, FormProvider } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { SourceType } from "@/server/entities/source/domain/Source";
import { api } from "@/trpc/react";
import Link from "next/link";
import Back from "../../../../../../public/images/Back.svg";
import { wordsIntoLines } from "@/app/utils";
import { Word } from "@/server/entities/source/domain/Source";
import { useSections } from "./useSections";
import { Viewer } from "./Viewer";
import { Preview } from "./Preview";
import { Menu } from "./Menu";
import { TimelineWrapper } from "./TimelineWrapper";
import { ClipType } from "@/server/entities/clip/domain/Clip";

export default function ClipEditor({
  source,
  timelineUrl,
  clip,
  words,
}: {
  source: SourceType,
  timelineUrl: string,
  clip: ClipType,
  words: Word[]
}) {
  const { start, end } = clip.range;
  const timer = useTimer(end - start);
  const [showPreview, setShowPreview] = useState(false);

  const { mutateAsync: createClip } = api.clip.save.useMutation();

  const form = useForm<ClipType>({
    defaultValues: clip,
  });

  const [dimensions, setDimensions] = useState<[number, number]>([0, 0]);

  const handleDimensionsUpdate = (newDim: [number, number]) => {
    const height = 480;
    const multiplier = height / newDim[1];
    const newW = newDim[0] * multiplier;

    setDimensions([newW, height]);
  }

  useEffect(() => {
    console.log("Setting dimensions", dimensions);
    form.setValue("width", dimensions[0]);
    form.setValue("height", dimensions[1]);
  }, [dimensions]);

  const {
    selectedSection,
    selectedSectionIndex,
    setSelectedSectionIndex,
    divideSection,
    deleteSection,
    changeDisplay,
    modifyFragment,
  } = useSections(timer, form);

  const lines = useMemo(() => {
    return wordsIntoLines(words);
  }, [words]);

  async function onSubmit() {
    const data = form.getValues();

    await createClip({
      id: clip.id,
      sourceId: source.id,
      name: data.name,
      range: data.range,
      width: data.width,
      height: data.height,
      sections: data.sections,
      theme: data.theme,
    });
  }

  return (
    <FormProvider {...form}>
      <form
        className="flex flex-col gap-y-3 h-screen"
        onSubmit={(e) => { e.preventDefault(); }}
      >
        <div className="flex flex-row gap-x-6 bg-white px-4 py-3 shadow-sm">
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
            <input
              type="text"
              className="border border-gray-200 rounded-lg p-2"
              {...form.register('name')}
            />
          </div>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            onClick={onSubmit}
          >
            Save
          </button>
        </div>
        <div className="h-[calc(100vh-90px)] flex flex-row gap-x-6 px-4">
          <Menu
            lines={lines}
            timer={timer}
            start={start}
            section={selectedSection}
            changeDisplay={changeDisplay}
          />
          <div className="w-2/3 flex flex-col items-center justify-between">
            <Viewer
              source={source.url!}
              start={start}
              timer={timer}
              section={selectedSection}
              modifyFragment={modifyFragment}
              dimensions={dimensions}
              setDimensions={handleDimensionsUpdate}
            />
            <TimelineWrapper
              timer={timer}
              source={source}
              start={start}
              duration={end - start}
              timelineUrl={timelineUrl}
              togglePreview={() => setShowPreview(!showPreview)}
              selectedSectionIndex={selectedSectionIndex}
              setSelectedSection={setSelectedSectionIndex}
              divideSection={divideSection}
              deleteSection={deleteSection}
            />
          </div>
        </div>
        <Preview
          isOpen={showPreview}
          closePreview={() => setShowPreview(false)}
          section={selectedSection}
          source={source}
          timer={timer}
          startTime={start}
          dimensions={dimensions}
          lines={lines}
        />
      </form>
    </FormProvider>
  );
}
