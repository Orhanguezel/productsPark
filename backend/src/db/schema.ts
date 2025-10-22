// ────────────────────────────────────────────────────────────────────────────────
// 4) src/db/schema.ts — Shared tables (composed by modules)
// (Modules export their own table definitions; this file re-exports)
// ────────────────────────────────────────────────────────────────────────────────
export * from '../modules/auth/schema';
export * from '../modules/siteSettings/schema';
export * from '../modules/categories/schema';
export * from '../modules/products/schema';
export * from '../modules/orders/schema';
export * from '../modules/cart/schema';