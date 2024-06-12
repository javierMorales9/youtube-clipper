import _ from "lodash";
import { env } from "@/env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3, UploadPartCommand, GetObjectCommand } from "@aws-sdk/client-s3";

export const S3Store = {
  getSignedUrls: async function (key: string) {
    return {
      manifest: `https://d20lwp9ni0p7dk.cloudfront.net/${key}/adaptive.m3u8`,
      timeline : `https://d20lwp9ni0p7dk.cloudfront.net/${key}/timeline1.png`,
    };
    /*
    const s3 = new S3({ region: env.AWS_REGION });

    return getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: env.SOURCE_BUCKET,
        Key: `${key}/adaptive.m3u8`,
      }),
    );
    */
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
};
