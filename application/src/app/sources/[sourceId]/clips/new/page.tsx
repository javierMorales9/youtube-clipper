import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function ClipCreation({
  params: { sourceId },
  searchParams,
}: {
  params: { sourceId: string };
  searchParams: { suggestion?: string, start?: string, end?: string };
}) {
  let clip;
  if (searchParams.suggestion) {
    clip = await api.clip.createFromSuggestion({
      suggestionId: searchParams.suggestion,
    });

    redirect(`/sources/${clip.sourceId}/clips/${clip.id}`);
  } else if (searchParams.start && searchParams.end) {
    clip = await api.clip.createNew({
      sourceId,
      start: parseFloat(searchParams.start),
      end: parseFloat(searchParams.end)
    });

    redirect(`/sources/${clip.sourceId}/clips/${clip.id}`);
  }
}

