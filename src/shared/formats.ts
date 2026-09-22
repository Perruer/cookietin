/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { normalizeSameSite, nowSeconds, type Cookie } from "./cookies";
import type { ExportFormat } from "./settings";

/** A cookie read from a file: the store is chosen at import time. */
export type ImportedCookie = Omit<Cookie, "storeId"> & { storeId?: string };

export type ImportFormat = "json" | "netscape" | "cqm" | "playwright";

export interface ImportResult {
  format: ImportFormat;
  cookies: ImportedCookie[];
  /** Lines/items that could not be read or are already expired. */
  skipped: number;
}

// ---------------------------------------------------------------- export

export function exportCookies(cookies: Cookie[], format: ExportFormat): string {
  switch (format) {
    case "netscape": return toNetscape(cookies);
    case "cqm": return toCqmJson(cookies);
    case "header": return toHeader(cookies);
    default: return toJson(cookies);
  }
}

export function exportFileName(format: ExportFormat): string {
  return format === "netscape" ? "cookies.txt" : format === "header" ? "cookie-header.txt" : "cookies.json";
}

/**
 * JSON array in the layout used by Cookie-Editor and EditThisCookie, so the
 * file can be imported by them (and by CookieTin, of course).
 */
export function toJson(cookies: Cookie[]): string {
  const list = cookies.map(c => {
    const o: Record<string, unknown> = {
      domain: c.domain,
      hostOnly: c.hostOnly,
      httpOnly: c.httpOnly,
      name: c.name,
      path: c.path,
      sameSite: c.sameSite,
      secure: c.secure,
      session: c.session,
      storeId: c.storeId,
      value: c.value
    };
    if (!c.session && c.expirationDate) o.expirationDate = c.expirationDate;
    if (c.firstPartyDomain) o.firstPartyDomain = c.firstPartyDomain;
    if (c.partitionKey?.topLevelSite) o.partitionKey = c.partitionKey;
    return o;
  });
  return JSON.stringify(list, null, 2);
}

/**
 * Netscape cookies.txt as curl, wget and yt-dlp read it. The second column
 * is "include subdomains" (Cookie Quick Manager wrote the opposite).
 */
export function toNetscape(cookies: Cookie[]): string {
  const lines = ["# Netscape HTTP Cookie File", "# Exported by CookieTin. Keep this file private: it can log you in.", ""];
  for (const c of cookies) {
    const includeSub = !c.hostOnly;
    const domain = includeSub && !c.domain.startsWith(".") ? "." + c.domain : c.domain;
    lines.push([
      (c.httpOnly ? "#HttpOnly_" : "") + domain,
      includeSub ? "TRUE" : "FALSE",
      c.path || "/",
      c.secure ? "TRUE" : "FALSE",
      String(c.session || !c.expirationDate ? 0 : Math.floor(c.expirationDate)),
      c.name,
      c.value
    ].join("\t"));
  }
  return lines.join("\n") + "\n";
}

/** "name=value; name2=value2" — ready for a Cookie request header. */
export function toHeader(cookies: Cookie[]): string {
  return cookies.map(c => `${c.name}=${c.value}`).join("; ");
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function cqmDate(seconds: number): string {
  const d = new Date(seconds * 1000);
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** The JSON layout of Cookie Quick Manager, for tools that expect it. */
export function toCqmJson(cookies: Cookie[]): string {
  return JSON.stringify(cookies.map(c => ({
    "Host raw": (c.secure ? "https://" : "http://") + c.domain + c.path,
    "Name raw": c.name,
    "Path raw": c.path,
    "Content raw": c.value,
    "Expires": c.session || !c.expirationDate ? "At the end of the session" : cqmDate(c.expirationDate),
    "Expires raw": String(c.session || !c.expirationDate ? 0 : Math.floor(c.expirationDate)),
    "Send for": c.secure ? "Encrypted connections only" : "Any type of connection",
    "Send for raw": String(c.secure),
    "HTTP only raw": String(c.httpOnly),
    "SameSite raw": c.sameSite === "unspecified" ? "no_restriction" : c.sameSite,
    "This domain only": c.hostOnly ? "Valid for host only" : "Valid for subdomains",
    "This domain only raw": String(c.hostOnly),
    "Store raw": c.storeId,
    "First Party Domain": c.firstPartyDomain || ""
  })), null, 2);
}

// ---------------------------------------------------------------- import

function bool(v: unknown): boolean {
  return v === true || String(v).toLowerCase() === "true";
}

function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Builds a cookie from loose fields. Returns null for unusable or already
 * expired entries.
 */
function makeCookie(f: {
  domain?: unknown; name?: unknown; value?: unknown; path?: unknown; secure?: unknown; httpOnly?: unknown;
  hostOnly?: unknown; sameSite?: unknown; expires?: number; session?: unknown; storeId?: unknown;
  firstPartyDomain?: unknown; partitionKey?: unknown;
}): ImportedCookie | null {
  const domain = String(f.domain ?? "").trim();
  const name = String(f.name ?? "");
  if (!domain || (!name && f.value === undefined)) return null;
  const expires = f.expires && f.expires > 0 ? Math.floor(f.expires) : undefined;
  const session = f.session !== undefined ? bool(f.session) || !expires : !expires;
  if (!session && expires! <= nowSeconds() + 1) return null;
  const c: ImportedCookie = {
    domain,
    name,
    value: String(f.value ?? ""),
    path: String(f.path || "/"),
    secure: bool(f.secure),
    httpOnly: bool(f.httpOnly),
    hostOnly: f.hostOnly !== undefined ? bool(f.hostOnly) : !domain.startsWith("."),
    sameSite: normalizeSameSite(f.sameSite),
    session
  };
  if (!session) c.expirationDate = expires;
  if (typeof f.storeId === "string" && f.storeId) c.storeId = f.storeId;
  if (typeof f.firstPartyDomain === "string" && f.firstPartyDomain) c.firstPartyDomain = f.firstPartyDomain;
  const pk = f.partitionKey as Cookie["partitionKey"];
  if (pk && typeof pk === "object" && typeof pk.topLevelSite === "string" && pk.topLevelSite) c.partitionKey = { ...pk };
  return c;
}

function fromCqmItem(o: Record<string, unknown>): ImportedCookie | null {
  // "Host raw": "https://.example.com/path"
  const host = String(o["Host raw"] ?? "").replace(/^[a-z]+:\/\//i, "");
  const slash = host.indexOf("/");
  const domain = slash === -1 ? host : host.slice(0, slash);
  return makeCookie({
    domain,
    name: o["Name raw"],
    value: o["Content raw"],
    path: o["Path raw"],
    secure: o["Send for raw"],
    httpOnly: o["HTTP only raw"],
    hostOnly: o["This domain only raw"] !== undefined ? o["This domain only raw"] : undefined,
    sameSite: o["SameSite raw"],
    expires: num(o["Expires raw"]),
    storeId: o["Store raw"],
    firstPartyDomain: o["First Party Domain"]
  });
}

function fromJsonItem(o: Record<string, unknown>): ImportedCookie | null {
  // expirationDate: EditThisCookie / Cookie-Editor / CookieTin;
  // expires: Playwright & Puppeteer (-1 = session); expiry: Selenium.
  const expires = num(o.expirationDate) ?? num(o.expires) ?? num(o.expiry);
  return makeCookie({
    domain: o.domain ?? o.host,
    name: o.name,
    value: o.value,
    path: o.path,
    secure: o.secure,
    httpOnly: o.httpOnly,
    hostOnly: o.hostOnly,
    sameSite: o.sameSite,
    expires,
    session: o.session,
    storeId: o.storeId,
    firstPartyDomain: o.firstPartyDomain,
    partitionKey: o.partitionKey
  });
}

function parseJson(text: string): ImportResult {
  let data: unknown = JSON.parse(text);
  let format: ImportFormat = "json";
  // Playwright storageState: { cookies: [...], origins: [...] }
  if (data && !Array.isArray(data) && typeof data === "object" && Array.isArray((data as any).cookies)) {
    data = (data as any).cookies;
    format = "playwright";
  }
  if (!Array.isArray(data)) data = [data];
  const items = data as Record<string, unknown>[];
  if (items.some(o => o && typeof o === "object" && "Host raw" in o)) format = "cqm";
  const cookies: ImportedCookie[] = [];
  let skipped = 0;
  for (const o of items) {
    const c = o && typeof o === "object" ? (format === "cqm" ? fromCqmItem(o) : fromJsonItem(o)) : null;
    if (c) cookies.push(c);
    else skipped++;
  }
  return { format, cookies, skipped };
}

function parseNetscape(text: string): ImportResult {
  const cookies: ImportedCookie[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    let line = raw;
    let httpOnly = false;
    if (line.startsWith("#HttpOnly_")) {
      httpOnly = true;
      line = line.slice("#HttpOnly_".length);
    } else if (!line.trim() || line.startsWith("#")) {
      continue;
    }
    const f = line.split("\t");
    if (f.length === 6) f.push(""); // empty value
    if (f.length < 7) {
      skipped++;
      continue;
    }
    const [domain, flag, path, secure, expires, name, ...rest] = f;
    // Real cookies.txt writes TRUE/FALSE with "include subdomains" in the
    // second column. Cookie Quick Manager wrote lowercase true/false with
    // "host only" there instead.
    const cqm = flag === "true" || flag === "false";
    const hostOnly = domain.startsWith(".") ? false : cqm ? bool(flag) : !bool(flag);
    const c = makeCookie({
      domain, name, value: rest.join("\t"), path, secure, httpOnly, hostOnly, expires: num(expires)
    });
    if (c) cookies.push(c);
    else skipped++;
  }
  return { format: "netscape", cookies, skipped };
}

/** Reads cookies from JSON (CookieTin, Cookie-Editor, EditThisCookie, Cookie Quick Manager, Playwright) or cookies.txt. */
export function parseImport(text: string): ImportResult {
  const trimmed = text.replace(/^﻿/, "").trim();
  if (!trimmed) return { format: "json", cookies: [], skipped: 0 };
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) return parseJson(trimmed);
  return parseNetscape(trimmed);
}
