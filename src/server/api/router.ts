import { sourceRouter } from "@/server/api/sources";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { clipRouter } from "@/server/api/clips";
import { suggestionRouter } from "@/server/api/suggestions";
import { companyRouter } from "@/server/api/companies";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  company: companyRouter,
  source: sourceRouter,
  clip: clipRouter,
  suggestion: suggestionRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
