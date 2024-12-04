'use client';

import { CompanyType } from "@/server/api/company/CompanySchema";
import { createContext, useContext, useState } from "react";

const CompanyContext = createContext<{
  update: (data: CompanyType) => void,
  data: CompanyType
}
>({
  update: () => { },
  data: {
    id: "",
    name: "",
    email: "",
    createdAt: new Date(),
  }
});

export function CompanyProvider({
  children,
  company,
}: {
  children: React.ReactNode;
  company: CompanyType;
}) {
  const [companyData, setCompanyData] = useState<CompanyType>(company);

  return (
    <CompanyContext.Provider value={{
      data: companyData,
      update: (data: CompanyType) => setCompanyData(data)
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}

