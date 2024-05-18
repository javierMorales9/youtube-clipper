'use client';
import Timeline from "../../timeline";
import Video from "../../video";
import { useTimer } from "../../useTimer";
import { useForm, FormProvider } from "react-hook-form";

const Steps = {
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

export default function Clip({ source, start, end }: { source: any, start: number, end: number }) {
  const timer = useTimer(end - start);
  const form = useForm<Schema>({
    defaultValues: {
      range: undefined,
    }
  });
  //const [step, setStep] = useState(Steps.ElementSelection);

  function onSubmit() { }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Video
          src={`${source.url}`}
          timer={timer}
          startTime={start}
        />

        <button onClick={() => timer.togglePlay()}>{timer.playing ? 'Stop' : 'Play'}</button>
        {timer.length && (
          <Timeline
            length={timer.length}
            currentTime={timer.currentTime}
            setCurrentTime={(time: number) => timer.seek(time)}
          />
        )}
      </form>
    </FormProvider>
  );
}
