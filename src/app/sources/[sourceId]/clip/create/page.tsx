import { api } from "@/trpc/server";
import Link from "next/link";
import Clip from "../Clip";

export default async function ClipCreation({
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
      <Clip source={source} />
    </div>
  );
}

