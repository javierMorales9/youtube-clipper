import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { PgCompanyRepository } from "@/server/entities/company/infrastructure/PgCompanyRepository";
import * as companyCrud from "@/server/entities/company/application/companyCrud";

export const companyRouter = createTRPCRouter({
  create: publicProcedure
    .input(companyCrud.CreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgCompanyRepository(ctx.db);

      return await companyCrud.create(repo, input);
    }),
  logIn: publicProcedure
    .input(companyCrud.LoginInputSchema)
    .mutation(async ({ ctx, input }) => {
      const repo = new PgCompanyRepository(ctx.db);

      return await companyCrud.login(repo, input);
    }),
  getFromToken: publicProcedure
    .input(companyCrud.GetFromTokenInputSchema)
    .query(async ({ ctx, input }) => {
      const repo = new PgCompanyRepository(ctx.db);

      return await companyCrud.getFromToken(repo, input);
    }),
});
