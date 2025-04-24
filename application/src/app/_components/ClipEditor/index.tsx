'use client';

import { useRouter } from "next/navigation";
import { useTimer } from "@/app/_components/useTimer";
import { useForm, FormProvider } from "react-hook-form";
import { useMemo, useState } from "react";
import { SourceType } from "@/server/entities/source/domain/Source";
import { api } from "@/trpc/react";
import Link from "next/link";
import Back from "../../../../public/images/Back.svg";
import { wordsIntoLines } from "@/app/utils";
import { Word } from "@/server/entities/source/domain/Source";
import { useSections } from "./useSections";
import { Viewer } from "./Viewer";
import { Preview } from "./Preview";
import { Menu } from "./Menu";
import { TimelineWrapper } from "./TimelineWrapper";
import { ClipType } from "@/server/entities/clip/domain/Clip";
import Loading from "../../../../public/images/Loading.svg";

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

  const [submitting, setSubmitting] = useState(false);

  const { mutateAsync: createClip } = api.clip.save.useMutation();

  const form = useForm<ClipType, null, undefined>({
    defaultValues: clip,
  });

  const router = useRouter();

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

    setSubmitting(true);

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

    router.push(`/sources/${source.id}/`);
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
            className={`bg-blue-500 text-white px-4 py-2 rounded-lg ${submitting ? 'bg-blue-300' : 'bg-blue-500'}`}
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <Loading className="w-6 h-6 fill-white" />
            ) : (
              <span>Save</span>
            )}
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
              dimensions={[source.width!, source.height!]}
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
          dimensions={[source.width!, source.height!]}
          lines={lines}
        />
      </form>
    </FormProvider>
  );
}
