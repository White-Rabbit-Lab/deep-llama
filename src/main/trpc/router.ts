import { publicProcedure, router } from "./core.js";
import { languageRouter } from "./routers/language.js";
import { modelsRouter } from "./routers/models.js";
import { themeRouter } from "./routers/theme.js";
import { todoRouter } from "./routers/todo.js";
import { translationRouter } from "./routers/translation.js";

/**
 * Main‑process tRPC router
 * — contains all server‑side procedures exposed to the renderer via IPC.
 */

/** Root router */
export const appRouter = router({
  /** Simple health‑check */
  ping: publicProcedure.query(() => "pong"),

  /** Todo domain procedures */
  task: todoRouter,

  /** Theme domain procedures */
  theme: themeRouter,

  /** Language domain procedures */
  lang: languageRouter,

  /** Translation domain procedures */
  translation: translationRouter,

  /** Model management procedures */
  models: modelsRouter,
});

/** Export router type for the renderer (type‑only import) */
export type AppRouter = typeof appRouter;
