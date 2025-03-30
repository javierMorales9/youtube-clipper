import { VideoData } from "./VideoData";

export interface VideoRepository {
  getVideoDuration(id: string): Promise<VideoData | null> ;
}
