/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext } from "./api";
import type { Cookie } from "./cookies";

/**
 * Protected cookies: { "<cookie domain>": ["name", …] }. Same shape and
 * storage key as Cookie Quick Manager, so its backups can be restored.
 */
export type ProtectedMap = Record<string, string[]>;

const KEY = "protected_cookies";

export async function getProtected(): Promise<ProtectedMap> {
  const got = await ext.storage.local.get(KEY);
  const map = got[KEY];
  return map && typeof map === "object" && !Array.isArray(map) ? (map as ProtectedMap) : {};
}

export function isProtected(map: ProtectedMap, c: Pick<Cookie, "domain" | "name">): boolean {
  return !!map[c.domain]?.includes(c.name);
}

/** Returns a new map with the cookies protected (flag=true) or unprotected. */
export function withProtection(map: ProtectedMap, cookies: Pick<Cookie, "domain" | "name">[], flag: boolean): ProtectedMap {
  const next: ProtectedMap = {};
  for (const [d, names] of Object.entries(map)) next[d] = [...names];
  for (const c of cookies) {
    const names = next[c.domain] || [];
    if (flag && !names.includes(c.name)) names.push(c.name);
    next[c.domain] = flag ? names : names.filter(n => n !== c.name);
  }
  // Drop empty domains: no need to remember sites the user no longer protects.
  for (const d of Object.keys(next)) if (!next[d].length) delete next[d];
  return next;
}

export async function setProtection(cookies: Pick<Cookie, "domain" | "name">[], flag: boolean): Promise<ProtectedMap> {
  const next = withProtection(await getProtected(), cookies, flag);
  await ext.storage.local.set({ [KEY]: next });
  return next;
}

export async function saveProtected(map: ProtectedMap): Promise<void> {
  await ext.storage.local.set({ [KEY]: map });
}

export function onProtectedChanged(cb: (m: ProtectedMap) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && changes[KEY]) cb((changes[KEY].newValue as ProtectedMap) || {});
  };
  ext.storage.onChanged.addListener(listener);
  return () => ext.storage.onChanged.removeListener(listener);
}

export function countProtected(map: ProtectedMap): number {
  return Object.values(map).reduce((n, names) => n + names.length, 0);
}
