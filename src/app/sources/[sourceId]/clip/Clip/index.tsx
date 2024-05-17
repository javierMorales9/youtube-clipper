'use client';
import { useState } from "react";
import Timeline from "../../Source/timeline";
import Video from "../../Source/video";
import { useTimer } from "../../useTimer";
import { useForm, FormProvider } from "react-hook-form";

const Steps = {
  RangeSelection: 1,
  SectionSelection: 2,
  ElementSelection: 3,
  DisplaySelection: 4,
  Review: 5,
};

type Schema = {
  range: {
    start: number;
    end: number;
  } | undefined,
}

export default function Clip({ source }: { source: any }) {
  const timer = useTimer();
  const form = useForm<Schema>({
    defaultValues: {
      range: undefined,
    }
  });
  const [step, setStep] = useState(Steps.RangeSelection);

  function onSubmit() { }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {step === Steps.RangeSelection && (
          <RangeSelection source={source} timer={timer} />
        )}
      </form>
    </FormProvider>
  );
}

function RangeSelection({ source, timer }: { source: any, timer: any }) {
  return (
    <>
      <Video
        src={`${source.url}`}
        startTime={0}
        timer={timer}
      />

      <button onClick={() => timer.togglePlay()}>{timer.playing ? 'Stop' : 'Play'}</button>
      {timer.length && (
        <Timeline
          length={timer.length}
          currentTime={timer.currentTime}
          setCurrentTime={(time: number) => timer.seek(time)}
        />
      )}
    </>
  );
}
