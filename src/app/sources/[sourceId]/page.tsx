import { api } from "@/trpc/server";
import Source from "./Source";
import { Suggestion } from "@/server/api/clips/SuggestionSchema";
import { env } from "@/env";
import { randomUUID } from "crypto";

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
      id: randomUUID(),
      name: "Suggestion test",
      description: "La descripcion pertinente asociada a la sugerencia de recorte",
      range: {
        start: 24,
        end: 42,
      },
    },
    {
      id: randomUUID(),
      name: "This clip is the best",
      description: "La descripcion pertinente asociada a la sugerencia de recorte",
      range: {
        start: 58,
        end: 112,
      },
    },
  ];

  return (
    <div className="px-6"> 
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
