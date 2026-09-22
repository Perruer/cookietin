/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext, isFirefox, t } from "./api";

/** A cookie store: the normal window, a private window or a Firefox container. */
export interface Store {
  id: string;
  name: string;
  kind: "default" | "private" | "container";
  /** CSS color of the badge. */
  color: string;
  /** Icon file in icons/containers/ (without .svg). */
  icon: string;
}

const FIREFOX_DEFAULT = "firefox-default";
const FIREFOX_PRIVATE = "firefox-private";

function defaultStore(id: string): Store {
  return { id, name: t("storeDefault"), kind: "default", color: "#8a8f98", icon: "circle" };
}

function privateStore(id: string): Store {
  return { id, name: t("storePrivate"), kind: "private", color: "#8f4ce6", icon: "private-browsing" };
}

const CONTAINER_ICONS = new Set([
  "briefcase", "cart", "chill", "circle", "dollar", "fence", "fingerprint", "food", "fruit", "gift", "pet", "tree", "vacation"
]);

/** All cookie stores the extension can read. */
export async function listStores(): Promise<Store[]> {
  if (isFirefox) {
    const stores: Store[] = [defaultStore(FIREFOX_DEFAULT)];
    try {
      if (await ext.extension.isAllowedIncognitoAccess()) stores.push(privateStore(FIREFOX_PRIVATE));
    } catch {
      /* Android without private browsing support */
    }
    const identities = (ext as any).contextualIdentities;
    if (identities?.query) {
      try {
        const list: any[] = (await identities.query({})) || [];
        for (const c of list) {
          stores.push({
            id: c.cookieStoreId,
            name: c.name,
            kind: "container",
            color: c.colorCode || "#8a8f98",
            icon: CONTAINER_ICONS.has(c.icon) ? c.icon : "circle"
          });
        }
      } catch {
        /* containers are disabled */
      }
    }
    return stores;
  }
  // Chromium: "0" is the regular profile, "1" appears while an incognito
  // window is open and the extension is allowed there.
  const stores: Store[] = [];
  try {
    for (const s of await ext.cookies.getAllCookieStores()) {
      stores.push(s.id === "0" ? defaultStore(s.id) : privateStore(s.id));
    }
  } catch {
    /* ignore */
  }
  if (!stores.some(s => s.id === "0")) stores.unshift(defaultStore("0"));
  return stores;
}

/** Cookie store of a tab. */
export function storeOfTab(tab: chrome.tabs.Tab): string {
  const id = (tab as any).cookieStoreId as string | undefined;
  if (id) return id;
  if (isFirefox) return tab.incognito ? FIREFOX_PRIVATE : FIREFOX_DEFAULT;
  return tab.incognito ? "1" : "0";
}

export function defaultStoreId(): string {
  return isFirefox ? FIREFOX_DEFAULT : "0";
}
