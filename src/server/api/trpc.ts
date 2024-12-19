/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { Db, db } from "@/server/db";
import { Company } from "@/server/entities/company/domain/Company";
import { company } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCClientError } from "@trpc/client";
import { PgCompanyRepository } from "../entities/company/infrastructure/PgCompanyRepository";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 *
 * This helper generates the "internals" for a tRPC context. The API handler and RSC clients each
 * wrap this and provides the required context.
 *
 * @see https://trpc.io/docs/server/context
 */
export const createTRPCContext = async (opts: {
  headers: Headers;
  id?: string;
}) => {
  try {
    const companyRepo = new PgCompanyRepository(db);
    let c: Company | null = null;

    const id = opts.id;
    if (id) {
      c = await companyRepo.getCompany(id);
    }

    return {
      db,
      company: c,
      headers: opts.headers,
    };
  } catch (error) {
    console.error("Error creating TRPC context:");
    return {
      db,
      headers: opts.headers,
    };
  }
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
type Protected = {
  db: Db;
  company: Company;
  headers: Headers;
}

const enforceUserIsAuthed = t.middleware<Protected>(({ ctx, next }) => {
  if (!ctx.company) {
    throw new TRPCClientError("UNAUTHORIZED");
  }

  const newCtx = {
    db: ctx.db,
    compnay: ctx.company,
    headers: ctx.headers,
  };
  return next({
    ctx: newCtx,
  });
});

export const protectedProcedure = t.procedure.use<Protected>(enforceUserIsAuthed);
