import { api } from "@/trpc/server";
import ClipEditor from "../ClipEditor";
import { DisplayKey, Displays } from "../Displays";

export default async function EditClip({
  params: { sourceId, clipId },
}: {
  params: { sourceId: string, clipId: string };
}) {
  const source = await api.source.find({ id: sourceId });

  if (!source || !source.url) {
    return <h1>Source not found</h1>
  }

  const clip = await api.clip.find({ id: clipId });

  if (!clip) {
    return <h1>Clip not found</h1>
  }

  const clipWords = await api.source.getClipWords({ sourceId, range: clip.range });

  return (
    <div className="">
      <ClipEditor
        source={source}
        timelineUrl={source.timelineUrl}
        clip={{
          ...clip,
          sections: clip.sections.map((section) => ({
            start: section!.start,
            end: section!.end,
            display: Displays[section!.display as DisplayKey],
            fragments: section!.fragments,
          })),
        }}
        words={clipWords}
      />
    </div>
  );
}

