/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * Second-level suffixes under which sites register names (example.co.uk).
 * Not the full Public Suffix List — enough to group cookies of one site
 * together for the common cases without shipping 200 KB of data.
 */
const MULTI_PART_SUFFIXES = new Set([
  "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "ltd.uk", "plc.uk", "net.uk",
  "com.au", "net.au", "org.au", "edu.au", "gov.au",
  "co.nz", "org.nz", "net.nz",
  "co.jp", "ne.jp", "or.jp", "ac.jp", "go.jp",
  "co.kr", "or.kr", "ne.kr",
  "com.br", "net.br", "org.br", "gov.br",
  "com.cn", "net.cn", "org.cn", "gov.cn",
  "com.hk", "com.tw", "com.sg", "com.my", "com.ph", "com.vn", "co.th", "co.id", "co.in", "net.in", "org.in",
  "com.mx", "com.ar", "com.co", "com.pe", "com.tr", "com.ua", "com.ru", "org.ru", "net.ru", "msk.ru", "spb.ru",
  "co.za", "com.eg", "com.sa", "co.il", "com.pl", "co.at", "or.at", "com.es",
  "github.io", "gitlab.io", "blogspot.com", "herokuapp.com", "vercel.app", "netlify.app", "pages.dev", "web.app",
  "firebaseapp.com", "appspot.com", "azurewebsites.net", "cloudfront.net", "amazonaws.com", "workers.dev"
]);

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/** Cookie domain without the leading dot: ".example.com" → "example.com". */
export function bareDomain(domain: string): string {
  return domain.startsWith(".") ? domain.slice(1) : domain;
}

/**
 * Registrable domain ("site") of a host: "www.shop.example.co.uk" →
 * "example.co.uk". IP addresses and single-label hosts stay as they are.
 */
export function baseDomain(host: string): string {
  const h = bareDomain(host.toLowerCase()).replace(/\.$/, "");
  if (IPV4.test(h) || h.includes(":") || !h.includes(".")) return h;
  const parts = h.split(".");
  if (parts.length <= 2) return h;
  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_SUFFIXES.has(lastTwo)) return parts.slice(-3).join(".");
  return lastTwo;
}

/** True if the cookie domain is `site` or one of its subdomains. */
export function domainInSite(cookieDomain: string, site: string): boolean {
  const d = bareDomain(cookieDomain.toLowerCase());
  const s = site.toLowerCase();
  return d === s || d.endsWith("." + s);
}

/** Host of a page URL, or "" for pages without one (about:, chrome:, file:). */
export function hostOf(url: string | undefined): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.hostname : "";
  } catch {
    return "";
  }
}

/** Host of a partition key's top-level site ("https://example.com" → "example.com"). */
export function siteHost(topLevelSite: string | undefined): string {
  if (!topLevelSite) return "";
  try {
    return new URL(topLevelSite).hostname;
  } catch {
    return topLevelSite.replace(/^[a-z]+:\/\//, "").replace(/[:/].*$/, "");
  }
}
