import { env } from "@/env";

export const DevStore = {
  getSignedUrls: async function (key: string) {
    const dir = env.AFTER_UPLOAD_URL;
    if (!dir) {
      throw new Error("Missing AFTER_UPLOAD_URL");
    }

    return {
      manifest: process.env.HLS ? `${dir}/${key}/adaptive.m3u8` : `${dir}/${key}/original.mp4`,
      timeline: `${dir}/${key}/timeline1.png`,
    };
  },
  initiateUpload: async function (name: string) {
    const dir = env.AFTER_UPLOAD_URL;
    if (!dir) {
      throw new Error("Missing AFTER_UPLOAD_URL");
    }

    return {
      fileId: name,
      parts: [
        {
          signedUrl: `${dir}/upload/${name}`,
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
    const dir = env.AFTER_UPLOAD_URL;
    if (!dir) {
      throw new Error("Missing AFTER_UPLOAD_URL");
    }

    return `${dir}/${fileKey}`;
  },
};
