import { api } from "@/trpc/server";
import Link from "next/link";
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

  const { range, sections } = clip;

  return (
    <div className="px-4">
      <Link href={`/sources/${sourceId}`}>
        Go back
      </Link>
      <ClipEditor
        source={source}
        clip={{
          clipId,
          range: {
            start: range.start,
            end: range.end,
          },
          sections: sections.map((section: any) => ({
            start: section.start,
            end: section.end,
            display: Displays[section.display as DisplayKey],
            fragments: section.fragments,
          })),
        }}
      />
    </div>
  );
}

