// Tiny CSS-string → React style-object helper. Lets us author inline styles
// as plain CSS strings instead of hand-converting every declaration to
// camelCase.
import type { CSSProperties } from 'react';

const cache = new Map<string, CSSProperties>();

export function s(css: string): CSSProperties {
  const hit = cache.get(css);
  if (hit) return hit;
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!prop) continue;
    const key = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = val;
  }
  cache.set(css, out as CSSProperties);
  return out as CSSProperties;
}
