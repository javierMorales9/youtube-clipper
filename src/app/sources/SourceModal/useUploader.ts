"use client";

import { useDevUploader } from "./useDevUploader";
import { useS3Uploader } from "./useS3Uploader";

export function useUploader({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
}) {
  if (process.env.NODE_ENV === "development") {
    return useS3Uploader({ file, setFile });
  } else {
    return useDevUploader({ file, setFile });
  }
}
