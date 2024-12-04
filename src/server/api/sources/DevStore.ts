export const DevStore = {
  getSignedUrls: async function (key: string) {
    return {
      manifest: process.env.HLS
        ? `/api/dev/files/${key}/adaptive.m3u8`
        : `/api/dev/files/${key}/original.mp4`,
      timeline: `/api/dev/files/${key}/timeline.png`,
      snapshot: `/api/dev/files/${key}/snapshot.png`,
    };
  },
  initiateUpload: async function (name: string) {
    return {
      fileId: name,
      parts: [
        {
          signedUrl: `api/dev/files/${name}/upload/`,
          PartNumber: 1,
        },
      ],
    };
  },
  completeUpload: async function (
    fileId: string,
    fileKey: string,
    parts: { PartNumber: number; ETag: string }[],
  ) {
    return `api/dev/files/${fileKey}`;
  },
};
