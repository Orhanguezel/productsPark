
// -------------------------------------------------------------
// FILE: src/integrations/metahub/search/dsl.ts
// -------------------------------------------------------------
export type Op = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "like" | "ilike" | "between";

export type Atom =
  | { op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte"; key: string; val: string | number | boolean }
  | { op: "in"; key: string; val: Array<string | number> }
  | { op: "like" | "ilike"; key: string; val: string }
  | { op: "between"; key: string; val: [number | string, number | string] };

export type Node = Atom | { op: "and" | "or"; nodes: Node[] };

export const DSL = {
  and: (...nodes: Node[]): Node => ({ op: "and", nodes }),
  or:  (...nodes: Node[]): Node => ({ op: "or", nodes }),
  eq:   (key: string, val: Atom["val"]) => ({ op: "eq", key, val } as Atom),
  neq:  (key: string, val: Atom["val"]) => ({ op: "neq", key, val } as Atom),
  gt:   (key: string, val: number | string) => ({ op: "gt", key, val } as Atom),
  gte:  (key: string, val: number | string) => ({ op: "gte", key, val } as Atom),
  lt:   (key: string, val: number | string) => ({ op: "lt", key, val } as Atom),
  lte:  (key: string, val: number | string) => ({ op: "lte", key, val } as Atom),
  like: (key: string, val: string) => ({ op: "like", key, val } as Atom),
  ilike:(key: string, val: string) => ({ op: "ilike", key, val } as Atom),
  in:   (key: string, val: Array<string | number>) => ({ op: "in", key, val } as Atom),
  between: (key: string, a: number | string, b: number | string) => ({ op: "between", key, val: [a, b] } as Atom),
} as const;

export function dslToParams(node: Node): Record<string, string> {
  const out: Record<string, string> = {};
  const push = (k: string, v: string) => { if (out[k]) out[k] += `,${v}`; else out[k] = v; };
  const walk = (n: Node): void => {
    if ("nodes" in n) { n.nodes.forEach(walk); return; }
    const { op, key } = n;
    switch (op) {
      case "eq": push(key, String(n.val)); break;
      case "neq": push(`${key}!`, String(n.val)); break;
      case "gt": push(`${key}>`, String(n.val)); break;
      case "gte": push(`${key}>=`, String(n.val)); break;
      case "lt": push(`${key}<`, String(n.val)); break;
      case "lte": push(`${key}<=`, String(n.val)); break;
      case "in": push(`${key}_in`, n.val.join("|")); break;
      case "like": push(`${key}~`, n.val); break;
      case "ilike": push(`${key}~~`, n.val); break;
      case "between": push(`${key}..`, `${String(n.val[0])}|${String(n.val[1])}`); break;
    }
  };
  walk(node);
  return out;
}

// NOTE: apply to from() is provided in Phase-7; here we keep REST param gen.
