"use client";

import { env } from "@/env";
import { useDevUploader } from "./useDevUploader";
import { useS3Uploader } from "./useS3Uploader";

export function useUploader({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
}) {
  if (env.NODE_ENV === "production") {
    return useS3Uploader({ file, setFile });
  } else {
    return useDevUploader({ file, setFile });
  }
}
