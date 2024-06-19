import { api } from "@/trpc/server";
import { SourceList } from "./SourceList";

export default async function Page() {
  const sources = await api.source.all({});

  return (
    <SourceList sources={sources} />
  );
}
