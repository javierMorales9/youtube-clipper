import { api } from "@/trpc/server";
import Link from "next/link";
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

  return (
    <div className="px-12">
      <Link href="/">
        Go back
      </Link>
      <Source source={source} />
    </div>
  );
}
