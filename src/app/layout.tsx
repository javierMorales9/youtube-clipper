import "@/styles/globals.css";

import { Inter } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

import { cookies, headers } from 'next/headers'
import { api } from "@/trpc/server";
import { CompanyType } from "@/server/api/company/CompanySchema";

import { CompanyProvider } from "./CompanyWrapper";

import { redirect } from 'next/navigation'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Bluesun",
  description: "Bluesun is an app for generating Tiktok and Instagram clips from longer videos.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  let company: CompanyType | null = null

  try {
    if (token) {
      company = await api.company.getFromToken({ token });
    }
  } catch (e) {
    console.error(e);
  }

  const url = headers().get('x-current-path');

  if (company !== null && (url === "/login" || url === "/signup")) {
    return redirect("/")
  }

  if (company !== null) {
    return (
      <html lang="en">
        <body className={`font-sans ${inter.variable}`}>
          <TRPCReactProvider>
            <CompanyProvider company={company}>
              {children}
            </CompanyProvider>
          </TRPCReactProvider>
        </body>
      </html>
    );
  }
  else if (url === "/login" || url === "/signup") {
    return (
      <html lang="en">
        <body className={`font-sans ${inter.variable}`}>
          <TRPCReactProvider>
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    );
  } else {
    redirect("/login")
  }
}

