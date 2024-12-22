import { env } from "@/env";
import { VideoDownloader } from "../domain/VideoDownloader";

export class ProdVideoDownloader implements VideoDownloader {
  async getVideoDuration(urlStr: string): Promise<number> {
    const url = new URL(urlStr);
    const id = url.searchParams.get("v");

    if (!id) {
      return 0;
    }

    if (!env.GOOGLE_API_KEY) {
      return 0;
    }

    const endpoint = new URL("https://www.googleapis.com/youtube/v3/videos");
    endpoint.search = new URLSearchParams({
      key: env.GOOGLE_API_KEY,
      part: "contentDetails",
      id: id,
    }).toString();

    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      const videos = data?.items || [];

      const video = videos[0];

      if(!video) {
        return 0;
      }

      return durationToSeconds(video?.contentDetails?.duration);
    } catch (e) {
      console.error(e);
      return 0;
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
