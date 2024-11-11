import { api } from "@/trpc/server";
import { redirect } from "next/navigation"; 

export default async function ClipCreation({
  params: { sourceId },
  searchParams,
}: {
  params: { sourceId: string };
  searchParams: { start: string, end: string };
}) {
  const clip = await api.clip.createNew({ sourceId, start: parseFloat(searchParams.start), end: parseFloat(searchParams.end) });
  redirect(`/sources/${clip.sourceId}/clips/${clip.id}`);
}

