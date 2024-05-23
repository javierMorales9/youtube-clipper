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

    const formData = new FormData();
    formData.append("file", file as Blob);

    setPercentage(0);
    setUploading(true);

    const parts = await initiate({ name: file.name || "", parts: 1 });
    const url = parts[0]?.signedUrl;

    await fetch(`${url}/upload`, {
      method: "POST",
      body: formData,
    });

    await complete({ id: file.name || "", parts: [] });

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
