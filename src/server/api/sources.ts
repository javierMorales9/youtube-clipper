import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { storeFactory } from "@/server/entities/source/infrastructure/storeFactory";
import { PgSourceRepository } from "@/server/entities/source/infrastructure/PgSourceRepository";
import { PgEventRepository } from "@/server/entities/event/infrastructure/PgEventRepository";
import * as sourceCrud from "@/server/entities/source/application/sourceCrud";
import * as sourceUpload from "@/server/entities/source/application/sourceUpload";
import { ProdVideoDownloader } from "../entities/source/infrastructure/ProdVideoDuration";

export const sourceRouter = createTRPCRouter({
  all: protectedProcedure.input(z.object({})).query(async ({ ctx }) => {
    const repo = new PgSourceRepository(ctx.db);
    const store = storeFactory();

    return await sourceCrud.all(repo, store, ctx.company.id);
  }),
  find: protectedProcedure
    .input(sourceCrud.FindInputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);
      const store = storeFactory();

      return await sourceCrud.find(repo, store, input);
    }),
  getClipWords: protectedProcedure
    .input(sourceCrud.GetClipWordsInputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);

      return await sourceCrud.getClipWords(repo, input);
    }),
  getUrlVideoDuration: protectedProcedure
    .input(sourceUpload.GetVideoDurationInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);
      const videoDownloader = new ProdVideoDownloader();

      return await sourceUpload.getUrlVideoDuration(
        repo,
        videoDownloader,
        input,
      );
    }),
  newUrlSource: protectedProcedure
    .input(sourceUpload.NewUrlSourceInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);

      return await sourceUpload.newUrlSource(
        repo,
        ctx.company.id,
        input,
      );
    }),
  initiateUpload: protectedProcedure
    .input(sourceUpload.UplaodInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);
      const store = storeFactory();

      return await sourceUpload.initiateUpload(
        repo,
        store,
        input,
        ctx.company.id,
      );
    }),
  completeUpload: protectedProcedure
    .input(sourceUpload.CompleteUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgSourceRepository(ctx.db);
      const eventRepo = new PgEventRepository(ctx.db);
      const store = storeFactory();

      await sourceUpload.completeUpload(
        repo,
        eventRepo,
        store,
        ctx.company.id,
        input,
      );
    }),
});
