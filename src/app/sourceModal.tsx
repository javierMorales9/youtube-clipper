'use client';

import { useState } from "react";
import { useUploader } from "./useUpload";

export default function SourceModal() {
  const [show, setShow] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { percentage, error, upload, onCancel, uploading, }
    = useUploader({ file, setFile });

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
            {file && !uploading && <button onClick={upload}>Upload a file</button>}
            {uploading && error === null && (
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
