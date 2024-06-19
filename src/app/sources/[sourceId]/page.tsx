import { api } from "@/trpc/server";
import Source from "./Source";

export default async function Sources({
  params: { sourceId },
}: {
  params: { sourceId: string };
}) {
  const source = await api.source.find({ id: sourceId });

  if (!source || !source.url) {
    return <h1>Source not found</h1>
  }

  const clips = await api.clip.fromSource({ sourceId });

  return (
    <div className="px-12 py-2"> 
      <Source
        source={source}
        clips={clips}
        timelineUrl={source.timelineUrl}
      />
    </div>
  );
}
