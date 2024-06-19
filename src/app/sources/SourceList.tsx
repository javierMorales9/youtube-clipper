'use client';

import Link from "next/link";
import SourceModal from "./SourceModal";
import PlayButton from "../../../public/images/MaterialSymbolsPlayArrow.svg";
import { useState } from "react";

export function SourceList({
  sources: initialSources,
}: {
  sources: any
}) {
  const [sources, setSources] = useState(initialSources);

  const addSource = (source: any) => {
    setSources([...sources, source]);
  };

  return (
    <div className="flex flex-col p-8">
      <div className="flex flex-row justify-start gap-x-3">
        <h1 className="text-3xl font-bold">Videos</h1>
        <SourceModal
          addSource={addSource}
        />
      </div>
      <div className="flex flex-row flex-wrap gap-x-5">
        {sources.map((source: any) => (
          <div className="flex flex-col p-4 bg-white border border-gray-300 rounded-lg my-4 w-1/4">
            {!source.processing && (
              <Link
                key={source.id}
                href={`/sources/${source.id}`}
                className="w-full h-full"
              >
                <div className="bg-black flex justify-center items-center h-40">
                  <PlayButton className="fill-white" />
                </div>
                <h2 className="text-xl font-bold">{source.name}</h2>
              </Link>
            )}
            {source.processing && (
              <div>
                <div className="bg-gray-300 flex justify-center items-center h-40">
                  <PlayButton className="fill-white" />
                </div>
                <h2 className="text-xl font-bold">{source.name}</h2>
                <p>Processing... Wait a few minutes until it is ready.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
