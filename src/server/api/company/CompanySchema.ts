import z from "zod";

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.date(),
});

export type CompanyType = z.infer<typeof CompanySchema>;
