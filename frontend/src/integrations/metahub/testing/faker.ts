
// -------------------------------------------------------------
// FILE: src/integrations/metahub/testing/faker.ts — seeded fake data
// -------------------------------------------------------------
export type RNG = () => number;
export function seedRng(seed = 42): RNG {
  let x = Math.imul(48271, seed) % 2147483647; // Lehmer RNG
  return () => (x = Math.imul(x, 48271) % 2147483647) / 2147483647;
}

export function pick<T>(arr: readonly T[], rnd: RNG) { return arr[Math.floor(rnd() * arr.length)] as T; }
export function int(min: number, max: number, rnd: RNG) { return Math.floor(rnd() * (max - min + 1)) + min; }

export type FakeUser = { id: string; name: string; email: string };
export function fakeUser(rnd: RNG): FakeUser {
  const names = ["Ada", "Bora", "Cem", "Deniz", "Ege", "Fırat", "Gül", "Hale", "Işık", "Jale"]; 
  const name = pick(names, rnd);
  const id = `u_${int(1000, 9999, rnd)}`; const email = `${name.toLowerCase()}${int(1,999,rnd)}@example.com`;
  return { id, name, email };
}

export type FakeOrder = { id: string; user_id: string; total_price: number; currency: string; status: "pending"|"paid"|"shipped"|"cancelled" };
export function fakeOrder(rnd: RNG, user: FakeUser): FakeOrder {
  const id = `o_${int(100000,999999,rnd)}`; const currency = pick(["TRY","EUR","USD"], rnd);
  const status = pick(["pending","paid","shipped","cancelled"], rnd);
  const total_price = int(50, 5000, rnd);
  return { id, user_id: user.id, total_price, currency, status };
}
