import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";

import { env } from "@/env";
import { appRouter } from "@/server/api/router";
import { createTRPCContext } from "@/server/api/trpc";
import { parseCookies } from "@/utils/parseCookies";
import { verifyjwt } from "@/utils/jwt";

/**
 * This wraps the `createTRPCContext` helper and provides the required context for the tRPC API when
 * handling a HTTP request (e.g. when you make requests from Client Components).
 */
const createContext = async (req: NextRequest) => {
  const heads = req.headers;
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
    headers: req.headers,
    id,
  });
};

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError:
      env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
