'use client';

import { useEffect, useState } from "react";
import { useUploader } from "./useUploader";
import Cross from "../../../../public/images/Cross.svg";
import UploadArrow from "../../../../public/images/UploadArrow.svg";
import { useDropzone } from 'react-dropzone'

export default function SourceModal({
  addSource,
}: {
  addSource: (source: any) => void
}) {
  const [show, setShow] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"drag-drop" | "uploading">("drag-drop");
  const [videoName, setVideoName] = useState<string>("");

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]!);
      }
    }
  })

  const { percentage, error, upload, onCancel, uploading, }
    = useUploader()({ file, setFile, videoName });

  const nextStep = async () => {
    setStep("uploading");
    upload();
  };

  useEffect(() => {
    console.log(percentage, uploading);

    if (percentage === 100 && uploading === false) {
      setFile(null);
      setVideoName("");
      toggleModal();
      addSource({ name: videoName, processing: true });
    }
  }, [percentage, uploading]);


  function toggleModal() {
    if (show) {
      setShow(false);
    }
    else {
      setShow(true);
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
          <div className="relative w-1/3 bg-white p-8 rounded-lg flex flex-col gap-y-4">
            <div
              className="absolute top-3 right-3 cursor-pointer"
              onClick={toggleModal}
            >
              <Cross className="w-8 h-8 fill-gray-500" />
            </div>
            <h1 className="text-2xl font-bold">Add Source</h1>

            {step === "drag-drop" && (
              <div className="flex flex-col gap-y-4">
                {file === null && (
                  <div
                    {...getRootProps()}
                    className={`border ${isDragActive ? 'border-blue-200' : 'border-gray-200'} rounded-lg p-4`}
                  >
                    <input {...getInputProps()} />
                    {isDragActive ? (
                      <div className="flex flex-col justify-center items-center cursor-pointer">
                        <UploadArrow className="w-16 h-16 fill-blue-500" />
                        <p>Drop it!</p>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center items-center cursor-pointer">
                        <UploadArrow className="w-16 h-16 fill-gray-500" />
                        <p>Drag 'n' drop some here, or click to select files</p>
                      </div>
                    )}
                  </div>
                )}

                {file && (
                  <div
                    className={`border  border-gray-200 rounded-lg p-4`}
                  >
                    <div className="flex flex-col justify-center items-center cursor-pointer">
                      <UploadArrow className="w-16 h-16 fill-blue-500" />
                      <p>
                        Saved correctly
                        <span
                          className="text-blue-500"
                          onClick={() => setFile(null)}
                        >
                          {' '}Change
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col">
                  <label htmlFor="file">Video name</label>
                  <input
                    type="text"
                    className="border border-gray-200 rounded-lg p-2"
                    onChange={(e) => setVideoName(e.target.value)}
                  />
                </div>

                {file && videoName && (
                  <button
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg"
                    onClick={nextStep}
                  >
                    Upload
                  </button>
                )}
              </div>
            )}
            {step === "uploading" && (
              <div>
                {error === null && (
                  <div>
                    <div>{percentage}%</div>
                    <button onClick={onCancel}>Cancel</button>
                  </div>
                )}
                {error && (
                  <div className="text-red-500">
                    {error.message}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
