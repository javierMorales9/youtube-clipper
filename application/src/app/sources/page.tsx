import { api } from "@/trpc/server";
import { SourceList } from "@/app/_components/SourceList";
import { env } from "@/env";
import TopBar from "../_components/TopBar";

export default async function Page() {
  const sources = await api.source.all({});

  console.log(env.NODE_ENV);
  return (
    <>
      <TopBar page="sources" />
      <SourceList sources={sources} />
    </>
  );
}
