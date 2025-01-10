'use client';

import { FrontendCompanyType } from "@/server/entities/company/domain/Company";
import { createContext, useContext, useState } from "react";
import Cookies from 'universal-cookie';
import { useRouter } from 'next/navigation'

const CompanyContext = createContext<{
  data: FrontendCompanyType,
  update: (data: FrontendCompanyType) => void,
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
  company: FrontendCompanyType;
}) {
  const router = useRouter();
  const [companyData, setCompanyData] = useState<FrontendCompanyType>(company);

  const signOut = () => {
    const cookies = new Cookies(null, { path: '/' });

    cookies.remove("token");
    router.push('/login');
  };

  return (
    <CompanyContext.Provider value={{
      data: companyData,
      update: (data: FrontendCompanyType) => setCompanyData(data),
      signOut,
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  return useContext(CompanyContext);
}

