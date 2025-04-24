import { env } from "@/env";
import { VideoRepository } from "../domain/VideoDownloader";
import { VideoData } from "../domain/VideoData";

export class ProdVideoRepository implements VideoRepository {
  async getVideoDuration(urlStr: string): Promise<VideoData | null> {
    const url = new URL(urlStr);
    const id = url.searchParams.get("v");

    if (!id) {
      return null;
    }

    if (!env.GOOGLE_API_KEY) {
      return null;
    }

    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.search = new URLSearchParams({
      key: env.GOOGLE_API_KEY,
      part: "contentDetails,snippet",
      id: id,
    }).toString();

    try {
      const response = await fetch(endpoint);
      type ApiResponse = {
        items: {
          snippet?: {
            title: string,
            tags: string[]
          },
          contentDetails?: { duration: string }
        }[]
      };
      const data: ApiResponse = await response.json();
      const videos = data.items ?? [];

      const video = videos[0];

      if(!video) {
        return null;
      }

      const title = video?.snippet?.title ?? "";
      const duration = durationToSeconds(video?.contentDetails?.duration);
      const tags = video?.snippet?.tags ?? [];

      return { title, duration, tags };
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}

const durationToSeconds = (durationString = "") => {
  const durationParts = durationString
    .replace("PT", "")
    .replace("H", ":")
    .replace("M", ":")
    .replace("S", "")
    .split(":");

  let duration = 0;
  if (durationParts.length === 3) {
    duration =
      parseInt(durationParts[0]!) * 3600 +
      parseInt(durationParts[1]!) * 60 +
      parseInt(durationParts[2]!);
  }

  if (durationParts.length === 2) {
    duration = parseInt(durationParts[0]!) * 60 + parseInt(durationParts[1]!);
  }

  if (durationParts.length === 1) {
    duration = parseInt(durationParts[0]!);
  }

  return duration;
};
