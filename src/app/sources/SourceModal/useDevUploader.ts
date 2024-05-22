'use client';
import { env } from "@/env";
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

  const upload = async () => {
    const url = env.NEXT_PUBLIC_AFTER_UPLOAD_URL;
    if(!url) return;

    const formData = new FormData();
    formData.append("file", file as Blob);

    setPercentage(0);
    setUploading(true);
    await fetch(`${url}/upload`, {
      method: "POST",
      body: formData,
    });
    setPercentage(100);
    setUploading(false);
  };

  const onCancel = () => {
  }

  return {
    percentage,
    error,
    upload,
    onCancel,
    uploading,
  };
}
