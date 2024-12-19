import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import z from "zod";
import { issueJwt, verifyjwt } from "@/utils/jwt";
import { Company } from "@/server/entities/company/domain/Company";
import { PgCompanyRepository } from "@/server/entities/company/infrastructure/PgCompanyRepository";

export const companyRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({ name: z.string(), email: z.string(), password: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const repo = new PgCompanyRepository(ctx.db);

      const theC = await Company.newCompany(input);

      await repo.saveCompany(theC);

      return { ...theC.publicPrimitives(), token: issueJwt(theC.id) };
    }),
  logIn: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const repo = new PgCompanyRepository(ctx.db);

      const theC = await repo.getCompanyByEmail(input.email);

      if (!theC) {
        throw new Error("Invalid email, please try again");
      }

      const passwordMatched = theC.comparePassword(input.password);

      if (!passwordMatched)
        throw new Error("Invalid password, please try again");

      const token = issueJwt(theC.id);

      return { ...theC.publicPrimitives(), token };
    }),
  getFromToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const repo = new PgCompanyRepository(ctx.db);

      const id = verifyjwt(input.token);

      const theC = await repo.getCompany(id);

      if (!theC) {
        return null;
      }

      return theC.publicPrimitives();
    }),
});
