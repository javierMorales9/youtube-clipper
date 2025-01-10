import { Company } from "./Company";

export interface CompanyRepository {
  getCompany(id: string): Promise<Company | null>;
  getCompanyByEmail(email: string): Promise<Company | null>;
  saveCompany(company: Company): Promise<void>;
}
