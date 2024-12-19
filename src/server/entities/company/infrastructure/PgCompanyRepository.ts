import { Db } from "@/server/db";
import { CompanyRepository } from "../domain/CompanyRepository";
import { Company } from "../domain/Company";
import { eq } from "drizzle-orm";
import { CompanyModel, company } from "@/server/db/schema";

export class PgCompanyRepository implements CompanyRepository {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async getCompany(id: string): Promise<Company | null> {
    const result = await this.db.query.company.findFirst({
      where: eq(company.id, id),
    });

    if (!result) {
      return null;
    }

    return parseCompany(result);
  }

  async saveCompany(theC: Company): Promise<void> {
    const data = theC.toPrimitives();

    await this.db
      .insert(company)
      .values(data)
      .onConflictDoUpdate({
        target: [company.id],
        set: {
          name: data.name,
          email: data.email,
          password: data.password,
        },
      });
  }

  async getCompanyByEmail(email: string): Promise<Company | null> {
      const theC = await this.db.query.company.findFirst({
        where: eq(company.email, email),
      });

      if(!theC) {
        return null;
      }

      return parseCompany(theC);
  }
}

function parseCompany(company: CompanyModel): Company {
  return new Company({
    id: company.id,
    email: company.email,
    password: company.password,
    name: company.name,
    createdAt: company.createdAt,
  });
}
