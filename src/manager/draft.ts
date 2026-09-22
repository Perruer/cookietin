/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { isFirefox } from "../shared/api";
import { nowSeconds, type Cookie, type SameSite } from "../shared/cookies";
import { bareDomain } from "../shared/domain";

/** Editable form of a cookie. */
export interface Draft {
  name: string;
  value: string;
  /** Without the leading dot; `includeSubdomains` adds it. */
  domain: string;
  includeSubdomains: boolean;
  path: string;
  storeId: string;
  session: boolean;
  /** <input type="datetime-local"> value in local time. */
  expires: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: SameSite;
  /** Top-level site of a partitioned cookie ("" = not partitioned). */
  partitionSite: string;
  hasCrossSiteAncestor?: boolean;
  firstPartyDomain?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function toLocalInput(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function fromLocalInput(value: string): number | undefined {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? Math.floor(ms / 1000) : undefined;
}

export function draftFromCookie(c: Cookie): Draft {
  return {
    name: c.name,
    value: c.value,
    domain: bareDomain(c.domain),
    includeSubdomains: !c.hostOnly,
    path: c.path,
    storeId: c.storeId,
    session: c.session || !c.expirationDate,
    expires: toLocalInput(c.expirationDate || nowSeconds() + 30 * 86400),
    secure: c.secure,
    httpOnly: c.httpOnly,
    sameSite: c.sameSite,
    partitionSite: c.partitionKey?.topLevelSite || "",
    hasCrossSiteAncestor: c.partitionKey?.hasCrossSiteAncestor,
    firstPartyDomain: c.firstPartyDomain
  };
}

export function newDraft(domain: string, storeId: string): Draft {
  return {
    name: "",
    value: "",
    domain,
    includeSubdomains: false,
    path: "/",
    storeId,
    session: false,
    expires: toLocalInput(nowSeconds() + 30 * 86400),
    secure: true,
    httpOnly: false,
    sameSite: "lax",
    partitionSite: "",
    firstPartyDomain: isFirefox ? "" : undefined
  };
}

function normalizeSite(site: string): string {
  const s = site.trim().replace(/\/+$/, "");
  return /^[a-z]+:\/\//i.test(s) ? s : "https://" + s;
}

export function cookieFromDraft(d: Draft): Cookie {
  const domain = bareDomain(d.domain.trim());
  const c: Cookie = {
    name: d.name,
    value: d.value,
    domain: d.includeSubdomains ? "." + domain : domain,
    hostOnly: !d.includeSubdomains,
    path: d.path.trim() || "/",
    storeId: d.storeId,
    session: d.session,
    secure: d.secure,
    httpOnly: d.httpOnly,
    sameSite: d.sameSite
  };
  if (!d.session) c.expirationDate = fromLocalInput(d.expires);
  if (d.partitionSite.trim()) {
    c.partitionKey = { topLevelSite: normalizeSite(d.partitionSite) };
    if (d.hasCrossSiteAncestor !== undefined) c.partitionKey.hasCrossSiteAncestor = d.hasCrossSiteAncestor;
  }
  if (d.firstPartyDomain !== undefined) c.firstPartyDomain = d.firstPartyDomain;
  return c;
}

/** Problems the browser would reject the cookie for, in plain words (message keys). */
export function draftProblems(d: Draft): string[] {
  const out: string[] = [];
  if (!d.domain.trim()) out.push("errDomainRequired");
  if (!d.session && (fromLocalInput(d.expires) ?? 0) <= nowSeconds()) out.push("errExpiresPast");
  if ((d.name.startsWith("__Secure-") || d.name.startsWith("__Host-")) && !d.secure) out.push("errPrefixSecure");
  if (d.name.startsWith("__Host-") && (d.includeSubdomains || (d.path.trim() || "/") !== "/")) out.push("errHostPrefix");
  if (d.sameSite === "no_restriction" && !d.secure) out.push("errSameSiteNone");
  if (d.partitionSite.trim() && !d.secure) out.push("errPartitionedSecure");
  return out;
}

// ---- value tools

export function b64Decode(v: string): string {
  const s = v.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padded = s + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = Uint8Array.from(bin, ch => ch.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function b64Encode(v: string): string {
  const bytes = new TextEncoder().encode(v);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** Decoded header and payload if the value is a JSON Web Token. */
export function decodeJwt(v: string): { header: unknown; payload: unknown } | null {
  const parts = v.trim().split(".");
  if (parts.length !== 3 || !/^eyJ/.test(parts[0])) return null;
  try {
    return { header: JSON.parse(b64Decode(parts[0])), payload: JSON.parse(b64Decode(parts[1])) };
  } catch {
    return null;
  }
}

export function byteSize(s: string): number {
  return new TextEncoder().encode(s).length;
}

/** "in 3 months" / "2 days ago" in the UI language. */
export function relativeTime(seconds: number, lang: string): string {
  const diff = seconds - nowSeconds();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]
  ];
  const [unit, size] = units.find(([, s]) => abs >= s) || ["second", 1];
  try {
    return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(Math.round(diff / size), unit);
  } catch {
    return "";
  }
}
