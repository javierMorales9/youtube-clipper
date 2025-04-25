import _ from "lodash";
import { env } from "@/env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, S3, UploadPartCommand } from "@aws-sdk/client-s3";
import { Store } from "../domain/Store";

export const S3Store: Store = {
  getSignedUrls: async function (key: string) {
    return {
      manifest: `${env.CLOUDFRONT_URL}/${key}/adaptive.m3u8`,
      timeline : `${env.CLOUDFRONT_URL}/${key}/timeline`,
      snapshot : `${env.CLOUDFRONT_URL}/${key}/snapshot.png`,
    };
  },
  initiateUpload: async function (name: string, parts: number) {
    const s3 = new S3({ region: env.AWS_REGION });

    const multipartUpload = await s3.createMultipartUpload({
      Bucket: env.SOURCE_BUCKET,
      Key: `${name}/original.mp4`,
    });

    const fileId = multipartUpload.UploadId;
    const fileKey = multipartUpload.Key;

    const multipartParams = {
      Bucket: env.SOURCE_BUCKET,
      Key: fileKey,
      UploadId: fileId,
    };

    const promises = [];

    for (let index = 0; index < parts; index++) {
      promises.push(
        getSignedUrl(
          s3,
          new UploadPartCommand({
            ...multipartParams,
            PartNumber: index + 1,
          }),
        ),
      );
    }

    const signedUrls = await Promise.all(promises);
    // assign to each URL the index of the part to which it corresponds
    const partSignedUrlList = signedUrls.map((signedUrl, index) => {
      return {
        signedUrl: signedUrl,
        PartNumber: index + 1,
      };
    });

    return {
      fileId,
      parts: partSignedUrlList,
    };
  },
  completeUpload: async function (
    fileId: string,
    fileKey: string,
    parts: { PartNumber: number; ETag: string }[],
  ) {
    const s3 = new S3({ region: env.AWS_REGION });

    console.log("Completing upload", fileId, fileKey, parts);
    const multipartParams = {
      Bucket: env.SOURCE_BUCKET,
      Key: `${fileKey}/original.mp4`,
      UploadId: fileId,
      MultipartUpload: {
        Parts: _.orderBy(parts, ["PartNumber"], ["asc"]),
      },
    };

    const { Location } = await s3.completeMultipartUpload(
      multipartParams as any,
    );
    return Location;
  },
  getClipFileURL: async function (sourceId: string, clipId: string) {
    const s3 = new S3({ region: env.AWS_REGION });
    const command = new GetObjectCommand({
      Bucket: env.SOURCE_BUCKET,
      Key: `${sourceId}/${clipId}.mp4`,
    })
    const signedUrl = await getSignedUrl(s3, command);

    return signedUrl;
  },
};
