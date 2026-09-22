/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { Cookie } from "./cookies";
import { siteHost } from "./domain";

export interface Query {
  /** Parts of domain names (any of them matches). */
  domains: string[];
  /** Parts of cookie names (any of them). */
  names: string[];
  /** Parts of cookie values (any of them). */
  values: string[];
}

/**
 * Parses a search like `google.com name:SID value:"a b"`. Cookie Quick
 * Manager's syntax `:name:"SID" :value:"x"` works too. Name and value groups
 * are combined with AND, the terms inside a group with OR.
 */
export function parseQuery(input: string): Query {
  const q: Query = { domains: [], names: [], values: [] };
  const re = /:?(name|value|domain):(?:"((?:[^"\\]|\\.)*)"|(\S+))|"((?:[^"\\]|\\.)*)"|(\S+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    if (m[1]) {
      const term = (m[2] ?? m[3] ?? "").replace(/\\(.)/g, "$1");
      if (!term) continue;
      const field = m[1].toLowerCase();
      (field === "name" ? q.names : field === "value" ? q.values : q.domains).push(term);
    } else {
      const term = (m[4] ?? m[5] ?? "").replace(/\\(.)/g, "$1");
      if (term) q.domains.push(term.toLowerCase());
    }
  }
  return q;
}

export function isEmptyQuery(q: Query): boolean {
  return !q.domains.length && !q.names.length && !q.values.length;
}

export function matchesDomain(domain: string, q: Query): boolean {
  if (!q.domains.length) return true;
  const d = domain.toLowerCase();
  return q.domains.some(term => d.includes(term.toLowerCase()));
}

/**
 * A partitioned cookie also matches the site it was stored under, so
 * searching "example.com" finds the third-party cookies kept for it.
 */
export function matchesCookie(c: Cookie, q: Query): boolean {
  const top = c.partitionKey?.topLevelSite;
  if (!matchesDomain(c.domain, q) && !(top && matchesDomain(siteHost(top), q))) return false;
  if (q.names.length && !q.names.some(n => c.name.includes(n))) return false;
  if (q.values.length && !q.values.some(v => c.value.includes(v))) return false;
  return true;
}
