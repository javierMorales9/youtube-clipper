import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { company } from "@/server/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import z from "zod";
import { v4 as uuidv4 } from "uuid";
import { env } from "@/env";
import jwt from "jsonwebtoken";
import { newDate } from "@/utils/newDate";

export const companyRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({ name: z.string(), email: z.string(), password: z.string() }),
    )
    .mutation(async ({ ctx, input }) => {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(input.password, salt);

      const id = uuidv4();

      const theC = {
        id,
        name: input.name,
        email: input.email,
        password: hashedPassword,
        createdAt: newDate(),
      };

      await ctx.db.insert(company).values(theC);

      return { ...theC, token: issueJwt(id) };
    }),
  logIn: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const theC = await ctx.db.query.company.findFirst({
        where: eq(company.email, input.email),
      });

      if (!theC) {
        throw new Error("Invalid email, please try again");
      }

      const passwordMatched = await bcrypt.compare(
        input.password,
        theC.password,
      );

      if (!passwordMatched)
        throw new Error("Invalid password, please try again");

      const token = issueJwt(theC.id);

      return { ...theC, token };
    }),
  getFromToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const id = verifyjwt(input.token);

      const theC = await ctx.db.query.company.findFirst({
        where: eq(company.id, id),
      });

      if (!theC) {
        return null;
      }

      return theC;
    }),
});

function issueJwt(id: string): string {
  return jwt.sign(id, env.SECRET);
}

function verifyjwt(token: string): string {
  return jwt.verify(token, env.SECRET) as string;
}
