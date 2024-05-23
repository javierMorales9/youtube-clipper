import { env } from "@/env";

export const DevStore = {
  getSignedUrl: async function (key: string) {
    const dir = env.NEXT_PUBLIC_DIR;
    if (!dir) {
      throw new Error("Missing NEXT_PUBLIC_DIR");
    }

    return `${dir}/${key}`;
  },
  initiateUpload: async function (name: string) {
    const dir = env.NEXT_PUBLIC_DIR;
    if (!dir) {
      throw new Error("Missing NEXT_PUBLIC_DIR");
    }

    return {
      fileId: name,
      parts: [
        {
          signedUrl: `${dir}/${name}`,
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
    const dir = env.NEXT_PUBLIC_DIR;
    if (!dir) {
      throw new Error("Missing NEXT_PUBLIC_DIR");
    }

    return `${dir}/${fileKey}`;
  },
};
