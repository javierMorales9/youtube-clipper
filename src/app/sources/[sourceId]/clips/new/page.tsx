import { api } from "@/trpc/server";
import ClipEditor from "../ClipEditor";

export default async function ClipCreation({
  params: { sourceId },
  searchParams,
}: {
  params: { sourceId: string };
  searchParams: { start: string, end: string };
}) {
  const source = await api.source.find({ id: sourceId });

  if (!source || !source.url) {
    return <h1>Source not found</h1>
  }

  return (
    <div className="px-4"> 
      <ClipEditor
        source={source}
        timelineUrl={source.timelineUrl}
        clip={{
          name: "",
          range: {
            start: parseFloat(searchParams.start),
            end: parseFloat(searchParams.end),
          },
          width: 0,
          height: 0,
          sections: [],
        }}
      />
    </div>
  );
}

