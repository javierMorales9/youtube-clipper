'use client';

import { ChangeEvent, useEffect, useState } from "react";
import { useUploader } from "./useUploader";
import Upload from "../../../../public/images/Upload.svg";
import { useDropzone } from 'react-dropzone'
import { NewSelect } from "@/app/_components/NewSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/Select"
import { Label } from "@/app/_components/Label";
import { Slider } from "@/app/_components/Slider";
import { NewInput } from "@/app/_components/NewInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/Tabs";

import { toReadableTime } from "@/app/utils";
import { Button } from "@/app/_components/Button";
import { api } from "@/trpc/react";

const lengths = [
  "<30s",
  "30s-1m",
  "1m-1.5m",
  "1.5m-3m",
  "3m-5m",
  "5m-10m",
  "10m-15m",
] as const;

const genres = [
  "Podcast",
  "Q&A",
  "Commentary",
  "Marketing",
  "Webinar",
  "Motivational speech",
  "Academic",
  "Listicle",
  "Product review",
  "How-to",
  "Comedy",
  "Sports comentary",
  "Church",
  "News",
  "Vlog",
  "Gaming",
] as const;

export type SourceData = {
  name: string;
  genre: string;
  tags: string[];
  clipLength: string;
  range: number[];
};

const MAX_TAGS = 20;

export default function NewSource({
  addSource,
}: {
  addSource: (source: any) => void
}) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [step, setStep] = useState<"input" | "data" | "uploading">("input");

  useEffect(() => {
    if (mode === "url") {
      if (videoUrl !== "") {
        setStep("data");
      } else {
        setStep("input");
      }
    }
    else {
      if (videoFile !== null) {
        setStep("data");
      } else {
        setStep("input");
      }
    }
  }, [mode]);

  const [videoData, setVideoData] = useState<SourceData | null>(null);

  const { percentage, error, upload, onCancel, uploading }
    = useUploader()({ file: videoFile, setFile: setVideoFile });

  const { mutateAsync: newUrlSource } = api.source.newUrlSource.useMutation();

  useEffect(() => {
    if (step === "uploading" && uploading === false) {
      finishUpload()
    }
  }, [percentage, uploading]);

  const fileInput = async (file: File, duration: number) => {
    setVideoFile(file as File);
    setVideoDuration(duration);
    setStep("data");
  };

  const clearFileInput = () => {
    setVideoFile(null);
    setVideoDuration(0);
    setStep("input");
  }

  const clearUrlInput = () => {
    setVideoUrl("");
    setVideoDuration(0);
    setStep("input");
  }

  const urlInput = async (file: string, duration: number) => {
    setVideoUrl(file as string);
    setVideoDuration(duration);
    setStep("data");
  }

  const addData = (data: SourceData) => {
    setVideoData(data);

    if (mode === "url") {
      newUrlSource({ url: videoUrl, ...data });
      addSource({ name: data?.name, processing: true });
      clearUrlInput();
    }
    else {
      setStep("uploading");
      upload(data);
    }
  }

  const finishUpload = () => {
    setVideoFile(null);
    setStep("input");
    addSource({ name: videoData?.name, processing: true });
  }

  return (
    <div className="relative w-1/3 bg-white p-8 rounded-lg flex flex-col gap-y-4 shadow-sm">
      <h1 className="text-2xl font-bold">Add Source</h1>
      <Tabs
        defaultValue="url"
        className="w-[400px]"
        onValueChange={(value) => setMode(value as "url" | "upload")}>
        <TabsList>
          <TabsTrigger value="url">Past an Url</TabsTrigger>
          <TabsTrigger value="upload">Upload file</TabsTrigger>
        </TabsList>
        <TabsContent value="url">
          <UrlNewSource
            videoUrl={videoUrl}
            finishInput={urlInput}
            clearUrlInput={clearUrlInput}
          />
        </TabsContent>
        <TabsContent value="upload">
          <UploadNewSource
            file={videoFile}
            finishInput={fileInput}
            clearFileInput={clearFileInput}
          />
        </TabsContent>
      </Tabs>

      {step === "data" && (
        <MetadataInput
          videoDuration={videoDuration}
          addData={addData}
        />
      )}

      {step === "uploading" && (
        <>
          {mode === "url" ? (
            <>URL</>
          ) : (
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
        </>
      )}
    </div>
  );
}

function MetadataInput({
  videoDuration,
  addData,
}: {
  videoDuration: number
  addData: (data: SourceData) => void
}) {
  const [videoName, setVideoName] = useState<string>("");
  const [genre, setGenre] = useState<string>(genres[0]);
  const [clipLength, setClipLength] = useState<string>(lengths[0]);
  const { tags, handleAddTag, handleRemoveTag } = useTags(MAX_TAGS);
  const [range, setRange] = useState<number[]>([0, 0]);
  useEffect(() => {
    setRange([0, videoDuration]);
  }, [videoDuration]);

  const addSourceData = () => {
    const data: SourceData = {
      name: videoName,
      genre,
      tags: tags ?? [],
      clipLength,
      range,
    };

    addData(data);
  }

  return (
    <>
      <div className="flex flex-col gap-y-3">
        <Label htmlFor="file">Video name</Label>
        <NewInput
          type="text"
          className="border border-gray-200 rounded-lg p-2"
          onChange={(e) => setVideoName(e.target.value)}
        />
      </div>
      <NewSelect
        value={genres[0]}
        options={genres.map((genre) => ({ value: genre, label: genre }))}
        onSelect={(value) => setGenre(value)}
        contentClassName="bg-white"
        label="Genre"
      />
      <div>
        <Label>Keywords</Label>
        <TagField
          tags={tags}
          addTag={handleAddTag}
          removeTag={handleRemoveTag}
          maxTags={MAX_TAGS}
        />
      </div>
      <div>
        <Label>Clip Length</Label>
        <Select
          defaultValue="<30s"
          onValueChange={(value) => setClipLength(value)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent className="">
            {lengths.map((theme) => (
              <SelectItem className="rounded-xl flex items-center" key={theme} value={theme}>
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-row gap-x-3">
        <div className="rounded py-2 px-4 border border-gray-300">
          {toReadableTime(range[0], { alwaysHours: true })}
        </div>
        <Slider
          color="blue"
          defaultValue={range}
          max={videoDuration}
          step={10}
          onValueChange={(value) => setRange(value)}
        />
        <div className="rounded py-2 px-4 border border-gray-300">
          {toReadableTime(range[1], { alwaysHours: true })}
        </div>
      </div>
      <Button onClick={addSourceData}>
        Add Source
      </Button>
    </>
  );
}

function UrlNewSource({
  videoUrl,
  finishInput,
  clearUrlInput,
}: {
  videoUrl: string,
  finishInput: (url: string, duration: number) => void,
  clearUrlInput: () => void
}) {
  const [url, setUrl] = useState<string>(videoUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { mutateAsync: getVideoDuration } = api.source.getUrlVideoDuration.useMutation();

  const handleUrlChange = async (url: string) => {
    if (url === "") {
      clearUrlInput();
      setUrl("");
      setError(null);
      return;
    }

    setUrl(url);
    setLoading(true);
    console.log(url);
  }

  useEffect(() => {
    const run = async () => {
      const duration = await getVideoDuration({ url });

      if (duration > 10 * 60) {
        finishInput(url, duration);
        setError(null);
        setLoading(false);
      }
      else if (duration === 0) {
        clearUrlInput();
        setError("Invalid youtube url");
        setLoading(false);
      } else {
        clearUrlInput();
        setError("Video should be grater than 10 minutes");
        setLoading(false);
      }
    }

    if (url !== "" && loading) {
      run();
    }
  }, [url]);

  return (
    <div className="flex flex-col gap-y-3">
      {error && (
        <Label className="text-red-500">
          {error}
        </Label>
      )}
      <Label htmlFor="file">Video url</Label>
      <NewInput
        type="text"
        value={url}
        className="border border-gray-200 rounded-lg p-2"
        onChange={(e) => handleUrlChange(e.target.value)}
      />
      {loading && (
        <div>Loading...</div>
      )}
    </div>);
}

function UploadNewSource({
  file,
  finishInput,
  clearFileInput,
}: {
  file: File | null,
  finishInput: (file: File, duration: number) => void,
  clearFileInput: () => void
}) {
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/mp4': ['.mp4'],
    },
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const f = acceptedFiles[0]!
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.ondurationchange = function() {
          window.URL.revokeObjectURL(video.src);
          const duration = video.duration;

          if (duration > 60 * 10) {
            finishInput(f, duration);
            setError(null);
          } else {
            setError("Video should be grater than 10 minutes");
          }
        }

        video.src = URL.createObjectURL(f);
      }
    }
  })

  return (
    <div className="">
      {error && (
        <Label className="text-red-500">
          {error}
        </Label>
      )}
      <div className="flex flex-col gap-y-4">
        {file === null && (
          <div
            {...getRootProps()}
            className={`border ${isDragActive ? 'border-blue-200' : 'border-gray-200'} rounded-lg p-4`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex flex-col justify-center items-center cursor-pointer">
                <Upload className="w-14 h-16 fill-blue-500" />
                <p>Drop it!</p>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center cursor-pointer">
                <Upload className="w-14 h-16 fill-gray-500" />
                <p>Drag n drop some here, or click to select files</p>
              </div>
            )}
          </div>
        )}

        {file && (
          <div
            className={`border  border-gray-200 rounded-lg p-4`}
          >
            <div className="flex flex-col justify-center items-center cursor-pointer">
              <Upload className="w-14 h-16 fill-blue-500" />
              <p>
                Saved correctly
                <span
                  className="text-blue-500"
                  onClick={clearFileInput}
                >
                  {' '}Cancel
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface iTag {
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  maxTags: number;
}

const useTags = (maxTags = 5) => {
  // Keep track of the tags array.

  const [tags, setTags] = useState<string[]>([]);

  // Function to handle adding the tag to the array

  const handleAddTag = (newTag: string) => {
    if (newTag && !tags.includes(newTag) && tags.length < maxTags) {
      setTags([...tags, newTag]);
    }
  };

  // Function to remove tag from array
  const handleRemoveTag = (tag: string) =>
    setTags(tags.filter((t) => t !== tag));

  // Return tags and functions from the hook

  return { tags, handleAddTag, handleRemoveTag };
};

export const TagField = ({ tags, addTag, removeTag, maxTags }: iTag) => {
  // track the use input

  const [userInput, setUserInput] = useState<string>(" ");

  // Handle input onChange

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
  };

  // handle Enter key press

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission or new line creation

      if (
        userInput.trim() !== "" &&
        //userInput.length <= 12 &&
        tags.length < maxTags
      ) {
        addTag(userInput);
        setUserInput(""); // Clear the input after adding a tag
      }
    }
  };

  return (
    <div className="flex flex-col w-[300px] md:w-[400px]">
      <input
        name="keyword_tags"
        type="text"
        placeholder={
          tags.length < maxTags
            ? "Add a tag"
            : `You can only enter max. of ${maxTags} tags`
        }
        className="w-full border border-gray-300 rounded-md px-4 py-2"
        onKeyDown={handleKeyPress}
        onChange={handleInputChange}
        value={userInput}
        disabled={tags.length === maxTags}
      />

      {/* ===== Render the tags here ===== */}

      <div className="flex flex-row flex-wrap gap-3 mt-4">
        {tags.map((tag: string, index: number) => (
          <span
            key={`${index}-${tag}`}
            className="inline-flex items-start justify-start px-3 py-2 rounded-[32px] text-sm shadow-sm font-medium bg-blue-100 text-blue-800 mr-2"
          >
            {tag}
            <button
              className="ml-2 hover:text-blue-500"
              onClick={() => removeTag(tag)}
              title={`Remove ${tag}`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};