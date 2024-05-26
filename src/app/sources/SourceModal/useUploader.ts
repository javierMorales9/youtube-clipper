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
  //We need to access the environment directly because we are 
  //forwarding the backend NODE_ENV to the frontend ENV
  //in next.config.js
  console.log(process.env.ENV);
  if (process.env.ENV === "production") {
    return useS3Uploader({ file, setFile });
  } else {
    return useDevUploader({ file, setFile });
  }
}
