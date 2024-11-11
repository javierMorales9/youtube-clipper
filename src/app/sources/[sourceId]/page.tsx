import { api } from "@/trpc/server";
import Source from "./Source";
import { SuggestionType } from "@/server/api/suggestion/Suggestion";
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
  const suggestions = await api.suggestion.fromSource({ sourceId });

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
