
// -------------------------------------------------------------
// FILE: src/integrations/metahub/mocks/handlers.ts (optional)
// -------------------------------------------------------------
// Requires msw if you enable this in dev/Storybook
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { rest } from "msw";

export const handlers = [
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  rest.get("/__health", (_req, res, ctx) => res(
    ctx.status(200), ctx.json({ ok: true, version: "dev", time: new Date().toISOString() })
  )),
];