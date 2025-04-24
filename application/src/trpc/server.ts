import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { createCaller } from "@/server/api/router";
import { createTRPCContext } from "@/server/api/trpc";
import { verifyjwt } from "@/utils/jwt";
import { parseCookies } from "@/utils/parseCookies";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a tRPC call from a React Server Component.
 */
const createContext = cache(() => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  const cookieStr = heads.get("cookie");
  if (!cookieStr) {
    return createTRPCContext({ headers: heads });
  }

  const cookies = parseCookies(cookieStr);
  const token = cookies.token;
  if (!token) {
    return createTRPCContext({ headers: heads });
  }

  const id = verifyjwt(token);

  return createTRPCContext({
    headers: heads,
    id,
  });
});

export const api = createCaller(createContext);
