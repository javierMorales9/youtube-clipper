import _ from "lodash";
import { env } from "@/env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3, UploadPartCommand } from "@aws-sdk/client-s3";

export const S3Uploader = {
  initiateUpload: async function (name: string) {
    const s3 = new S3({ region: env.AWS_REGION });

    const multipartUpload = await s3.createMultipartUpload({
      Bucket: env.SOURCE_BUCKET,
      Key: name,
    });

    return {
      fileId: multipartUpload.UploadId,
      fileKey: multipartUpload.Key,
    };
  },
  getSignedUrls: async function (
    fileId: string,
    fileKey: string,
    parts: number,
  ) {
    const s3 = new S3({ region: env.AWS_REGION });

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
      parts: partSignedUrlList,
    };
  },
  completeUpload: async function (
    fileId: string,
    fileKey: string,
    parts: { PartNumber: number; ETag: string }[],
  ) {
    const s3 = new S3({ region: env.AWS_REGION });

    const multipartParams = {
      Bucket: env.SOURCE_BUCKET,
      Key: fileKey,
      UploadId: fileId,
      MultipartUpload: {
        Parts: _.orderBy(parts, ["PartNumber"], ["asc"]),
      },
    };

    await s3.completeMultipartUpload(multipartParams as any);
  },
};
