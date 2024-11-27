"use client";

import { useDevUploader } from "./useDevUploader";
import { useS3Uploader } from "./useS3Uploader";

export function useUploader() {
  //We need to access the environment directly because we are 
  //forwarding the backend NODE_ENV to the frontend ENV
  //in next.config.js
  if (true || process.env.ENV === "production") {
    return useS3Uploader;
  } else {
    return useDevUploader;
  }
}
