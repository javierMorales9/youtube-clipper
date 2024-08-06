import { api } from "@/trpc/server";
import Source from "./Source";
import { Suggestion } from "@/server/api/clips/SuggestionSchema";
import { env } from "@/env";

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
  const suggestions: Suggestion[] = [
    {
      name: "Suggestion test",
      description: "La descripcion pertinente asociada a la sugerencia de recorte",
      range: {
        start: 1000,
        end: 1100,
      },
    },
  ];

  return (
    <div className="px-12 py-2"> 
      <Source
        source={source}
        clips={clips}
        suggestions={suggestions}
        timelineUrl={source.timelineUrl}
        hls={env.HLS}
      />
    </div>
  );
}
