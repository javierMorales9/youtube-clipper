import { api } from "@/trpc/server";
import SourceModal from "./sourceModal";

export default async function Page() {
  const sources = await api.source.all({});

  return (
    <div className="flex flex-col p-8">
      <div className="flex flex-row justify-start gap-x-3">
        <h1 className="text-3xl font-bold">Sources</h1>
        <SourceModal />
      </div>
      {sources.map((source) => (
        <div key={source.id} className="flex flex-col p-4 border border-gray-200 rounded-lg my-4">
          <h2 className="text-xl font-bold">{source.name}</h2>
        </div>
      ))}
    </div>
  );
}
