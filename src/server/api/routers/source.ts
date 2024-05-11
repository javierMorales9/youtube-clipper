import { z } from "zod";
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3, UploadPartCommand } from "@aws-sdk/client-s3";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { source } from "@/server/db/schema";
import { env } from "@/env";

export const sourceRouter = createTRPCRouter({
  initiateUpload: publicProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const s3 = new S3({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const { name } = input;
      const multipartUpload = await s3.createMultipartUpload({
        Bucket: env.SOURCE_BUCKET,
        Key: name,
      });

      return {
        fileId: multipartUpload.UploadId,
        fileKey: multipartUpload.Key,
      };
    }),
  getSignedUrls: publicProcedure
    .input(
      z.object({ fileId: z.string(), fileKey: z.string(), parts: z.number() }),
    )
    .mutation(async ({ ctx, input }) => {
      const s3 = new S3({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const { fileId, fileKey, parts } = input;

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
    }),
  completeUpload: publicProcedure
    .input(
      z.object({
        fileId: z.string(),
        fileKey: z.string(),
        parts: z.array(z.object({ PartNumber: z.number(), ETag: z.string() })),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const s3 = new S3({
        region: env.AWS_REGION,
        credentials: {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        },
      });

      const { fileId, fileKey, parts } = input;

      const multipartParams = {
        Bucket: env.SOURCE_BUCKET,
        Key: fileKey,
        UploadId: fileId,
        MultipartUpload: {
          Parts: _.orderBy(parts, ["PartNumber"], ["asc"]),
        },
      };

      const output = await s3.completeMultipartUpload(multipartParams as any);

      return {
        location: output.Location,
      };
    }),
  create: publicProcedure
    .input(z.object({ name: z.string().min(1), url: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(source).values({
        id: uuidv4(),
        name: input.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
  all: publicProcedure.input(z.object({})).query(async ({ ctx }) => {
    return ctx.db.query.source.findMany();
  }),
});
