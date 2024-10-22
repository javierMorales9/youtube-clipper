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
import { Button } from "@/app/_components/Button";
import { toReadableTime } from "@/app/utils";

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
  "Auto",
  "Manuel",
] as const;

export type SourceData = {
  name: string;
  genre: string;
  tags: string[];
  clipLength: string;
  range: number[];
};

export default function SourceModal({
  addSource,
}: {
  addSource: (source: any) => void
}) {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"drag-drop" | "uploading">("drag-drop");
  const [videoName, setVideoName] = useState<string>("");
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [invalidError, setInvalidError] = useState<string | null>(null);

  const { percentage, error, upload, onCancel, uploading }
    = useUploader()({ file, setFile });

  const [genre, setGenre] = useState<string>(genres[0]);
  const [clipLength, setClipLength] = useState<string>(lengths[0]);

  const MAX_TAGS = 5;
  const { tags, handleAddTag, handleRemoveTag } = useTags(MAX_TAGS);

  const [range, setRange] = useState<number[]>([0, 0]);
  useEffect(() => {
    setRange([0, videoDuration]);
  }, [videoDuration]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'video/mp4': ['.mp4'],
    },
    onDrop: (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const f = acceptedFiles[0]!
        var video = document.createElement('video');
        video.preload = 'metadata';
        video.ondurationchange = function() {
          window.URL.revokeObjectURL(video.src);
          const duration = video.duration;

          // if video is less than 10 minutes long
          // we can't accept it
          if (duration > 60 * 10) {
            setFile(f);
            setVideoDuration(duration);
            setInvalidError(null);
          } else {
            setInvalidError("Video should be grater than 10 minutes");
          }
        }

        video.src = URL.createObjectURL(f);
      }
    }
  })

  const nextStep = async () => {
    const data: SourceData = {
      name: videoName,
      genre,
      tags,
      clipLength,
      range,
    };
    setStep("uploading");
    upload(data)
      .then(() => {
        setStep("drag-drop");
      })
  };

  const handleChoseAnotherFile = () => {
    setFile(null);
    setInvalidError("");
  }

  useEffect(() => {
    console.log(percentage, uploading);

    if (percentage === 100 && uploading === false) {
      setFile(null);
      setVideoName("");
      addSource({ name: videoName, processing: true });
    }
  }, [percentage, uploading]);

  return (
    <div className="relative w-1/3 bg-white p-8 rounded-lg flex flex-col gap-y-4">
      <h1 className="text-2xl font-bold">Add Source</h1>
      {invalidError && (
        <Label className="text-red-500">
          {invalidError}
        </Label>
      )}

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
                    onClick={handleChoseAnotherFile}
                  >
                    {' '}Cancel
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-y-3">
            <Label htmlFor="file">Video name</Label>
            <NewInput
              type="text"
              className="border border-gray-200 rounded-lg p-2"
              onChange={(e) => setVideoName(e.target.value)}
            />
          </div>

          {file && videoName && (
            <>
              <NewSelect
                value="Auto"
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
              <Button onClick={nextStep} >
                Upload
              </Button>
            </>
          )}
        </div>
      )}
      {
        step === "uploading" && (
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
        )
      }
    </div >);
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
