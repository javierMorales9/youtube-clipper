'use client';

import { useState } from "react";

export default function() {
  const [file, setFile] = useState<File | null>(null);

  function handleFileChange(e: any) {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  }

  const handleUpload = async () => {
    if (file) {
      console.log("Uploading file...");

      const formData = new FormData();
      formData.append("file", file);

      try {
        // You can write the URL of your server or any other endpoint used for file upload
        const result = await fetch("api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await result.json();

        console.log(data);
      } catch (error) {
        console.error(error);
      }
    }
  }

  return (
    <>
      <input id="file" type="file" onChange={handleFileChange} />
      {file && <button onClick={handleUpload}>Upload a file</button>}
    </>
  );
}
