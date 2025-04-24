import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { newDate } from "@/utils/newDate";
import bcrypt from "bcrypt";

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  password: z.string(),
  createdAt: z.date(),
});

export type CompanyType = z.infer<typeof CompanySchema>;

export const FrontendCompanySchema = CompanySchema.omit({ password: true });
export type FrontendCompanyType = z.infer<typeof FrontendCompanySchema>;

export class Company {
  readonly id: string;
  private name: string;
  private email: string;
  private password: string;
  private createdAt: Date;

  constructor({
    id,
    name,
    email,
    password,
    createdAt,
  }: {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.password = password;
    this.createdAt = createdAt;
  }

  static async newCompany({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) {
    const id = uuidv4();

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    return new Company({
      id,
      name,
      email,
      password: hashedPassword,
      createdAt: newDate(),
    });
  }

  toPrimitives() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      password: this.password,
      createdAt: this.createdAt,
    };
  }

  publicPrimitives() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt,
    };
  }

  async comparePassword(password: string) {
    return await bcrypt.compare(password, this.password);
  }
}
