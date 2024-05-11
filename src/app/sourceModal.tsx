'use client';

import { api } from "@/trpc/react";
import { useState } from "react";
import { Uploader } from "./Upload";

export default function SourceModal() {
  const [show, setShow] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [uploader, setUploader] = useState<Uploader | null>(null);
  const [percentage, setPercentage] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const { mutateAsync: initiate } = api.source.initiateUpload.useMutation();
  const { mutateAsync: getUrls } = api.source.getSignedUrls.useMutation();
  const { mutateAsync: complete } = api.source.completeUpload.useMutation();

  function toggleModal() {
    if (show) {
      setShow(false);
    }
    else {
      setShow(true);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]!);
    }

    e.target.value = '';
  }

  const handleUpload = async () => {
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
          setPercentage(newPercentage)
        }
      })
      .onError((error: any) => {
        setError(error)
        setFile(null)
        setUploader(null)
      })
      .onCompleted(() => {
        setFile(null)
        setUploader(null)
      })

    uploader.start().catch(console.error)
  }

  const onCancel = () => {
    if (uploader) {
      uploader.abort()
    }
  }

  return (
    <div>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        onClick={toggleModal}
      >
        Add Source
      </button>

      {show && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-start p-20"
        >
          <div className="bg-white p-8 rounded-lg flex flex-col gap-y-4">
            <div className="flex flex-row justify-between items-center">
              <h1 className="text-2xl font-bold">Add Source</h1>
              <div
                className="text-lg font-bold cursor-pointer"
                onClick={toggleModal}
              >
                X
              </div>
            </div>

            <input id="file" type="file" onChange={handleFileChange} />
            {file && uploader === null && <button onClick={handleUpload}>Upload a file</button>}
            {uploader !== null && error === null && (
              <div>
                <div>{percentage}%</div>
                <button onClick={onCancel}>Cancel</button>
              </div>
            )}
            {error && <div>{error.message}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
