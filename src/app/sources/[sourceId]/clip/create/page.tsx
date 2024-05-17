import Video from "@/app/sources/[sourceId]/video";
import { api } from "@/trpc/server";
import Link from "next/link";

export default async function Sources({
  params: { sourceId },
}: {
  params: { sourceId: string };
}) {
  const source = await api.source.find({ id: sourceId });

  if (!source || !source.url) {
    return <h1>Source not found</h1>
  }

  return (
    <div className="px-12">
      <Link href={`/sources/${sourceId}`}>
        Go back
      </Link>
      <Video
        src={`${source.url}`}
        startTime={0}
        duration={37}
      />
    </div>
  );
}

