
// -------------------------------------------------------------
// FILE: src/integrations/metahub/testing/loadtest.ts — ramp scripts
// -------------------------------------------------------------
import { seedRng, fakeUser, fakeOrder } from "./faker";
import { trackAction, trackPerf } from "@/integrations/metahub/observability/telemetry";

export type RampConfig = { users: number; durationMs: number; rps: number };

export async function runRamp(config: RampConfig) {
  const rnd = seedRng(1337);
  const users = Array.from({ length: config.users }, () => fakeUser(rnd));
  const start = performance.now();

  let sent = 0;
  while (performance.now() - start < config.durationMs) {
    const batchStart = performance.now();
    const batch = Math.max(1, Math.floor(config.rps / 10));

    const tasks = Array.from({ length: batch }, async () => {
      const user = users[Math.floor(Math.random() * users.length)];
      const t0 = performance.now();
      const order = fakeOrder(rnd, user); // simulated workload
      const t1 = performance.now();
      trackAction("lt_fake_order", { order_id: order.id, amount: order.total_price, currency: order.currency, status: order.status }, user.id);
      trackPerf("lt_fake_order_gen", t1 - t0, true, { user: user.id });
    });

    await Promise.all(tasks);
    sent += batch;

    const spent = performance.now() - batchStart;
    const target = 1000 / 10; // 10 cycles per second
    if (spent < target) await sleep(target - spent);
  }
  return { sent } as const;
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
