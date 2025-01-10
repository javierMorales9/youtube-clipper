import { z } from "zod";
import { CompanyRepository } from "@/server/entities/company/domain/CompanyRepository";
import { Company } from "@/server/entities/company/domain/Company";
import { issueJwt, verifyjwt } from "@/utils/jwt";

export const CreateInputSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
});
export type CreateInput = z.infer<typeof CreateInputSchema>;
export async function create(repo: CompanyRepository, input: CreateInput) {
  const theC = await Company.newCompany(input);

  await repo.saveCompany(theC);

  return { ...theC.publicPrimitives(), token: issueJwt(theC.id) };
}

export const LoginInputSchema = z.object({
  email: z.string(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;
export async function login(repo: CompanyRepository, input: LoginInput) {
  const theC = await repo.getCompanyByEmail(input.email);

  if (!theC) {
    throw new Error("Invalid email, please try again");
  }

  const passwordMatched = theC.comparePassword(input.password);

  if (!passwordMatched) throw new Error("Invalid password, please try again");

  const token = issueJwt(theC.id);

  return { ...theC.publicPrimitives(), token };
}

export const GetFromTokenInputSchema = z.object({ token: z.string() });
type GetFromTokenInput = z.infer<typeof GetFromTokenInputSchema>;
export async function getFromToken(
  repo: CompanyRepository,
  input: GetFromTokenInput,
) {
  const id = verifyjwt(input.token);

  const theC = await repo.getCompany(id);

  if (!theC) {
    return null;
  }

  return theC.publicPrimitives();
}
