"use client";
import { api } from "@/trpc/react";
import { useState } from "react";
import { Uploader } from "./Upload";

export function useUploader({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
}) {
  const [uploader, setUploader] = useState<Uploader | null>(null);
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync: initiate } = api.source.initiateUpload.useMutation();
  const { mutateAsync: getUrls } = api.source.getSignedUrls.useMutation();
  const { mutateAsync: complete } = api.source.completeUpload.useMutation();

  const upload = async () => {
    if (!file) return;
    setPercentage(0);
    setError(null);

    const uploader = new Uploader({
      fileName: file.name,
      file: file,
      initiate,
      getUrls,
      complete,
    });
    setUploader(uploader);

    uploader
      .onProgress(({ percentage: newPercentage }: { percentage: any }) => {
        // to avoid the same percentage to be logged twice
        if (newPercentage !== percentage) {
          setPercentage(newPercentage);
        }
      })
      .onError((error: any) => {
        setError(error);
        setFile(null);
        setUploader(null);
      })
      .onCompleted(() => {
        setFile(null);
        setUploader(null);
      });

    uploader.start().catch(console.error);
  };

  const onCancel = () => {
    if (uploader) {
      uploader.abort()
    }
  }

  return {
    percentage,
    error,
    upload,
    onCancel,
    uploading: uploader !== null,
  };
}
