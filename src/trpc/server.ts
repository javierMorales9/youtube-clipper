import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { createCaller } from "@/server/api/router";
import { createTRPCContext } from "@/server/api/trpc";
import { verifyjwt } from "@/utils/jwt";

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

function parseCookies(cookieStr: string): Record<string, string> {
  return cookieStr
    .split(";")
    .map((str) => str.trim().split(/=(.+)/))
    .reduce((acc: Record<string, string>, curr) => {
      const key = curr[0];
      const value = curr[1];
      if (!key || !value) {
        return acc;
      }

      acc[key] = value;
      return acc;
    }, {});
}

function parseJWT(token: string): { sub: string } {
  console.log('token', Buffer.from(token.split('.')[1]!, 'base64').toString());
  return JSON.parse(Buffer.from(token.split('.')[1]!, 'base64').toString()) as {
    sub: string;
  };
}
