'use client';

import { CompanyType } from "@/server/api/company/CompanySchema";
import { createContext, useContext, useState } from "react";
import Cookies from 'universal-cookie';
import { useRouter } from 'next/navigation'

const CompanyContext = createContext<{
  data: CompanyType,
  update: (data: CompanyType) => void,
  signOut: () => void,
}
>({
  data: {
    id: "",
    name: "",
    email: "",
    createdAt: new Date(),
  },
  update: () => { },
  signOut: () => { },
});

export function CompanyProvider({
  children,
  company,
}: {
  children: React.ReactNode;
  company: CompanyType;
}) {
  const router = useRouter();
  const [companyData, setCompanyData] = useState<CompanyType>(company);

  const signOut = () => {
    const cookies = new Cookies(null, { path: '/' });

    cookies.remove("token");
    router.push('/login');
  };

  return (
    <CompanyContext.Provider value={{
      data: companyData,
      update: (data: CompanyType) => setCompanyData(data),
      signOut,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}

