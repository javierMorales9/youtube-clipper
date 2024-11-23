import { useCallback } from "react";
import { Accept, useDropzone } from "react-dropzone";
import { Label } from "./Label";
import { UploadIcon } from "@radix-ui/react-icons";

export function Upload({
  file,
  setFile,
  accept,
}: {
  file: File | null;
  setFile: (file: File) => void;
  accept: Accept;
}) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setFile(acceptedFiles[0]!);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
  })

  return (
    <div className="w-full flex flex-col gap-y-3">
      <Label>Upload Csv</Label>
      <div
        {...getRootProps()}
        className={`
        flex flex-col items-center justify-center 
        py-5 cursor-pointer
        border border-dashed rounded-lg border-muted-foreground
        ${isDragActive ? "opacity-50" : ""}
      `}
      >
        <input {...getInputProps()} />

        {!file && (
          <UploadIcon className="w-14 h-14" />
        )}
        {!file && isDragActive ? (
          <p>Drop the file here ...</p>
        ) : (
          <p>{"Drag 'n' drop some files here, or click to select files"}</p>
        )}
        {file && (
          <p>
            {file.name} - {file.size} bytes
          </p>
        )}
      </div>
    </div>
  );
}
