import Video from "@/app/_components/video";
import { api } from "@/trpc/server";

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
    <div>
      <h1>{source.name}</h1>
      <Video src={source.url} />
    </div>
  );
}
