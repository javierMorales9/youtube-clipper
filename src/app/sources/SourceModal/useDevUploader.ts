"use client";
import { api } from "@/trpc/react";
import { useState } from "react";

export function useDevUploader({
  file,
  setFile,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
}) {
  const [percentage, setPercentage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync: initiate } = api.source.initiateUpload.useMutation();
  const { mutateAsync: complete } = api.source.completeUpload.useMutation();

  const upload = async () => {
    if (!file) {
      return;
    }
    setPercentage(0);
    setUploading(true);

    const { parts, id } = await initiate({ name: file.name || "", parts: 1 });
    const url = parts[0]?.signedUrl;

    if (!url) {
      setError(new Error("Failed to initiate upload"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file as Blob);

    await fetch(url, {
      method: "POST",
      body: formData,
    });

    await complete({ id, parts: [] });

    setPercentage(100);
    setUploading(false);
  };

  const onCancel = () => {};

  return {
    percentage,
    error,
    upload,
    onCancel,
    uploading,
  };
}
