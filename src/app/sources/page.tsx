import { api } from "@/trpc/server";
import { SourceList } from "./SourceList";
import { env } from "@/env";

export default async function Page() {
  const sources = await api.source.all({});

  console.log(env.NODE_ENV);
  return (
    <SourceList sources={sources} />
  );
}
