"use client";
import { api } from "@/trpc/react";
import { useState } from "react";
import { Uploader } from "./Upload";
import { SourceData } from ".";

export function useS3Uploader({
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
  const { mutateAsync: complete } = api.source.completeUpload.useMutation();

  const upload = async (data: SourceData) => {
    if (!file) return;
    setPercentage(0);
    setError(null);

    const uploader = new Uploader({
      file: file,
      videoData: data,
      initiate,
      complete,
    });
    setUploader(uploader);

    uploader
      .onProgress(({ percentage: newPercentage }: { percentage: any }) => {
        // to avoid the same percentage to be logged twice
        console.log('indside the on progress', newPercentage);
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

