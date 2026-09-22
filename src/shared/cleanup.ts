/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext } from "./api";
import { getAll, isPartitioned, removeCookies, type Cookie } from "./cookies";
import { baseDomain, domainInSite, hostOf, siteHost } from "./domain";
import { getProtected, isProtected } from "./protect";
import { listStores } from "./stores";

export interface CleanupResult {
  removed: number;
  kept: number;
  failed: number;
}

/**
 * Cookies that belong to a site: its own (and its subdomains') cookies plus
 * the partitioned cookies that other sites stored while embedded in it.
 */
export function siteCookies(all: Cookie[], site: string): Cookie[] {
  return all.filter(c => domainInSite(c.domain, site) ||
    (isPartitioned(c) && baseDomain(siteHost(c.partitionKey!.topLevelSite)) === site));
}

/** Deletes cookies, skipping protected ones. */
export async function deleteUnprotected(cookies: Cookie[]): Promise<CleanupResult> {
  const map = await getProtected();
  const targets = cookies.filter(c => !isProtected(map, c));
  const failed = await removeCookies(targets);
  return { removed: targets.length - failed.length, kept: cookies.length - targets.length, failed: failed.length };
}

/** Sites open in any tab (to keep their cookies during periodic cleanup). */
async function openSites(): Promise<Set<string>> {
  const tabs = await ext.tabs.query({});
  const sites = new Set<string>();
  for (const tab of tabs) {
    const host = hostOf(tab.url);
    if (host) sites.add(baseDomain(host));
  }
  return sites;
}

/** Deletes every unprotected cookie in every store (optionally sparing open sites). */
export async function cleanAll(keepOpenTabs: boolean): Promise<CleanupResult> {
  const stores = await listStores();
  const all = (await Promise.all(stores.map(s => getAll({ storeId: s.id }).catch(() => [] as Cookie[])))).flat();
  let targets = all;
  if (keepOpenTabs) {
    const open = await openSites();
    targets = all.filter(c => {
      const site = baseDomain(c.domain);
      const top = isPartitioned(c) ? baseDomain(siteHost(c.partitionKey!.topLevelSite)) : "";
      return !open.has(site) && !(top && open.has(top));
    });
  }
  const r = await deleteUnprotected(targets);
  return { ...r, kept: r.kept + (all.length - targets.length) };
}
