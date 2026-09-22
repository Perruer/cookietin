/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext, isFirefox } from "./api";
import { bareDomain } from "./domain";

export type SameSite = "no_restriction" | "lax" | "strict" | "unspecified";

export interface PartitionKey {
  topLevelSite?: string;
  hasCrossSiteAncestor?: boolean;
}

/** A cookie as the cookies API returns it (Firefox adds firstPartyDomain). */
export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSite;
  session: boolean;
  /** Seconds since the epoch; absent for session cookies. */
  expirationDate?: number;
  hostOnly: boolean;
  storeId: string;
  /** First-Party Isolation (Firefox, privacy.firstparty.isolate). */
  firstPartyDomain?: string;
  /** Partitioned ("CHIPS" / Total Cookie Protection) cookies. */
  partitionKey?: PartitionKey;
}

const SAME_SITE: SameSite[] = ["no_restriction", "lax", "strict", "unspecified"];

export function normalizeSameSite(value: unknown): SameSite {
  const v = String(value ?? "").toLowerCase();
  if (v === "none" || v === "no_restriction") return "no_restriction";
  if (SAME_SITE.includes(v as SameSite)) return v as SameSite;
  return "unspecified";
}

/** URL that the cookies API needs to address a cookie. */
export function cookieUrl(c: Pick<Cookie, "domain" | "path" | "secure">): string {
  return (c.secure ? "https://" : "http://") + bareDomain(c.domain) + (c.path || "/");
}

/** Everything that makes a cookie unique in the browser. */
export function cookieKey(c: Cookie): string {
  return [
    c.storeId, c.domain, c.path, c.name, c.firstPartyDomain ?? "",
    c.partitionKey?.topLevelSite ?? "", c.partitionKey?.hasCrossSiteAncestor ? "x" : ""
  ].join("");
}

export function isPartitioned(c: Cookie): boolean {
  return !!c.partitionKey?.topLevelSite;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Details for cookies.set() that recreate `c` (in `c.storeId`). */
export function toSetDetails(c: Cookie): chrome.cookies.SetDetails & Record<string, unknown> {
  const d: chrome.cookies.SetDetails & Record<string, unknown> = {
    url: cookieUrl(c),
    name: c.name,
    value: c.value,
    path: c.path || "/",
    secure: c.secure,
    httpOnly: c.httpOnly,
    storeId: c.storeId
  };
  // A host-only cookie is set by leaving the domain out.
  if (!c.hostOnly) d.domain = c.domain.startsWith(".") ? c.domain : "." + c.domain;
  if (!c.session && c.expirationDate) d.expirationDate = c.expirationDate;
  const sameSite = normalizeSameSite(c.sameSite);
  // Firefox has no "unspecified" value; leaving it out gives the default.
  if (!(isFirefox && sameSite === "unspecified")) d.sameSite = sameSite;
  if (isFirefox && c.firstPartyDomain !== undefined) d.firstPartyDomain = c.firstPartyDomain;
  if (c.partitionKey?.topLevelSite) d.partitionKey = { ...c.partitionKey };
  return d;
}

function toRemoveDetails(c: Cookie): chrome.cookies.CookieDetails & Record<string, unknown> {
  const d: chrome.cookies.CookieDetails & Record<string, unknown> = {
    url: cookieUrl(c),
    name: c.name,
    storeId: c.storeId
  };
  if (isFirefox && c.firstPartyDomain !== undefined) d.firstPartyDomain = c.firstPartyDomain;
  if (c.partitionKey?.topLevelSite) d.partitionKey = { ...c.partitionKey };
  return d;
}

let partitionQuerySupported: boolean | undefined;

/**
 * cookies.getAll() including partitioned and first-party-isolated cookies.
 * Without `partitionKey: {}` both browsers silently skip partitioned cookies,
 * which is why Cookie Quick Manager could not delete some of them.
 */
export async function getAll(filter: Record<string, unknown> = {}): Promise<Cookie[]> {
  const base: Record<string, unknown> = { ...filter };
  if (isFirefox) base.firstPartyDomain = null;
  if (partitionQuerySupported !== false) {
    try {
      const list = await ext.cookies.getAll({ ...base, partitionKey: {} } as any);
      partitionQuerySupported = true;
      return list as Cookie[];
    } catch (e) {
      // Older Chromium: no partitionKey in the filter.
      if (partitionQuerySupported === true) throw e;
      partitionQuerySupported = false;
    }
  }
  return (await ext.cookies.getAll(base as any)) as Cookie[];
}

/** All cookies of the given cookie stores. A store that fails is skipped. */
export async function listCookies(storeIds: string[]): Promise<Cookie[]> {
  const lists = await Promise.all(storeIds.map(storeId => getAll({ storeId }).catch(() => [] as Cookie[])));
  return lists.flat();
}

export async function setCookie(c: Cookie): Promise<Cookie> {
  const result = await ext.cookies.set(toSetDetails(c) as any);
  if (!result) throw new Error("The browser refused this cookie.");
  return result as Cookie;
}

export async function removeCookie(c: Cookie): Promise<boolean> {
  try {
    const r = await ext.cookies.remove(toRemoveDetails(c) as any);
    return !!r;
  } catch {
    return false;
  }
}

/** Removes cookies; returns the ones that could not be removed. */
export async function removeCookies(cookies: Cookie[]): Promise<Cookie[]> {
  const results = await Promise.all(cookies.map(c => removeCookie(c)));
  return cookies.filter((_, i) => !results[i]);
}

/**
 * Saves `next`; if its identity differs from `prev` (renamed, moved to
 * another domain/path/container), the old cookie is removed afterwards.
 */
export async function replaceCookie(prev: Cookie | null, next: Cookie): Promise<Cookie> {
  const saved = await setCookie(next);
  if (prev && cookieKey(prev) !== cookieKey(saved)) await removeCookie(prev);
  return saved;
}

/** Copies cookies into another store. Expired and session-less failures are counted. */
export async function copyCookies(cookies: Cookie[], storeId: string): Promise<{ copied: number; failed: number }> {
  let copied = 0;
  let failed = 0;
  for (const c of cookies) {
    try {
      await setCookie({ ...c, storeId });
      copied++;
    } catch {
      failed++;
    }
  }
  return { copied, failed };
}
