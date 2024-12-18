export interface Store {
  getSignedUrls(
    id: string,
  ): Promise<{ manifest: string; timeline: string; snapshot: string }>;
  initiateUpload: (
    name: string,
    parts: number,
  ) => Promise<{
    fileId: string | undefined;
    parts: { signedUrl: string; PartNumber: number }[];
  }>;
  completeUpload: (
    fileId: string,
    fileKey: string,
    parts: { PartNumber: number; ETag: string }[],
  ) => Promise<string | undefined>;
}
