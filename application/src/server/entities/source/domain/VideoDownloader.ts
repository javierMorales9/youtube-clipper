export interface VideoDownloader {
  getVideoDuration(id: string): Promise<number>;
}
