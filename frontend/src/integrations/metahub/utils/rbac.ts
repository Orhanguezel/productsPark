
// -------------------------------------------------------------
// FILE: src/integrations/metahub/utils/rbac.ts
// -------------------------------------------------------------
export type Role = "guest" | "customer" | "staff" | "manager" | "admin";
export type Action = "read" | "create" | "update" | "delete" | "manage";
export type Scope = "orders" | "products" | "coupons" | "pages" | "users" | "settings" | "payments" | "all";

export type Policy = { role: Role; allow: Array<{ scope: Scope; actions: Action[] }> };

const POLICIES: Policy[] = [
  { role: "guest", allow: [ { scope: "products", actions: ["read"] }, { scope: "pages", actions: ["read"] } ] },
  { role: "customer", allow: [ { scope: "orders", actions: ["read","create"] }, { scope: "payments", actions: ["create","read"] } ] },
  { role: "staff", allow: [ { scope: "orders", actions: ["read","update"] }, { scope: "products", actions: ["read","update"] }, { scope: "coupons", actions: ["read","update"] } ] },
  { role: "manager", allow: [ { scope: "orders", actions: ["manage"] }, { scope: "products", actions: ["manage"] }, { scope: "coupons", actions: ["manage"] }, { scope: "users", actions: ["read","update"] } ] },
  { role: "admin", allow: [ { scope: "all", actions: ["manage"] }, { scope: "settings", actions: ["manage"] } ] },
];

function hasAction(actions: Action[], asked: Action): boolean {
  return actions.includes("manage") || actions.includes(asked);
}

export function can(role: Role | readonly Role[], action: Action, scope: Scope): boolean {
  const roles = Array.isArray(role) ? role : [role];
  for (const r of roles) {
    const pol = POLICIES.find((p) => p.role === r);
    if (!pol) continue;
    for (const rule of pol.allow) {
      if (rule.scope === scope || rule.scope === "all") {
        if (hasAction(rule.actions, action)) return true;
      }
    }
  }
  return false;
}

export function some(roles: readonly Role[], checks: Array<{ action: Action; scope: Scope }>): boolean {
  return checks.some((c) => can(roles, c.action, c.scope));
}

export function every(roles: readonly Role[], checks: Array<{ action: Action; scope: Scope }>): boolean {
  return checks.every((c) => can(roles, c.action, c.scope));
}