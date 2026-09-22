/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { ext, isFirefox, t } from "../shared/api";
import { deleteUnprotected, siteCookies } from "../shared/cleanup";
import { getAll, setCookie, type Cookie } from "../shared/cookies";
import { baseDomain, hostOf } from "../shared/domain";
import { openManager } from "../shared/open";
import { getProtected, isProtected } from "../shared/protect";
import { listStores, storeOfTab, type Store } from "../shared/stores";
import { AccessBanner, StoreBadge, localizePage, useHostAccess, useSettings, useTheme } from "../ui/common";
import { BroomIcon, GearIcon, HeartIcon, SearchIcon, TrashIcon, WindowIcon } from "../ui/icons";

interface Info {
  tab: chrome.tabs.Tab;
  host: string;
  site: string;
  store: Store | undefined;
  storeId: string;
  site_cookies: Cookie[];
  store_cookies: Cookie[];
  protectedSite: number;
  protectedStore: number;
  storageItems: number | null;
}

/** The tab to act on: the active one, or ?tab=<id> (used by the tests). */
async function targetTab(): Promise<chrome.tabs.Tab> {
  const id = Number(new URLSearchParams(location.search).get("tab"));
  if (id) return ext.tabs.get(id);
  const [tab] = await ext.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/** Number of localStorage + sessionStorage entries of the page. */
async function countStorage(tabId: number): Promise<number | null> {
  try {
    const [res] = await ext.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          return localStorage.length + sessionStorage.length;
        } catch {
          return 0;
        }
      }
    });
    return typeof res?.result === "number" ? res.result : null;
  } catch {
    return null;
  }
}

/** Clears localStorage, sessionStorage, IndexedDB and Cache Storage of the site. */
async function clearSiteData(tab: chrome.tabs.Tab, host: string): Promise<void> {
  if (tab.id !== undefined) {
    try {
      await ext.scripting.executeScript({
        target: { tabId: tab.id },
        func: async () => {
          try { localStorage.clear(); } catch { /* blocked */ }
          try { sessionStorage.clear(); } catch { /* blocked */ }
          try {
            for (const db of await indexedDB.databases()) if (db.name) indexedDB.deleteDatabase(db.name);
          } catch { /* not supported */ }
          try {
            for (const key of await caches.keys()) await caches.delete(key);
          } catch { /* not supported */ }
        }
      });
    } catch {
      /* page where scripts can't run */
    }
  }
  // Other origins of the site that are not open right now.
  try {
    if (isFirefox) {
      await ext.browsingData.remove({ hostnames: [host] } as any, { localStorage: true, indexedDB: true, serviceWorkers: true } as any);
    } else {
      const origins = [`https://${host}`, `http://${host}`];
      await ext.browsingData.remove({ origins } as any, {
        localStorage: true, indexedDB: true, cacheStorage: true, serviceWorkers: true, fileSystems: true
      });
    }
  } catch {
    /* ignore */
  }
}

function Popup() {
  const [settings] = useSettings();
  useTheme(settings.theme);
  const [access, grant] = useHostAccess();
  const [info, setInfo] = useState<Info | null>(null);
  const [message, setMessage] = useState("");
  const [undo, setUndo] = useState<Cookie[] | null>(null);
  const [confirmStore, setConfirmStore] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const tab = await targetTab();
    const host = hostOf(tab.url);
    const site = host ? baseDomain(host) : "";
    const storeId = storeOfTab(tab);
    const [stores, storeCookies, map] = await Promise.all([
      listStores(),
      getAll({ storeId }).catch(() => [] as Cookie[]),
      getProtected()
    ]);
    const mine = site ? siteCookies(storeCookies, site) : [];
    setInfo({
      tab, host, site, storeId,
      store: stores.find(s => s.id === storeId),
      site_cookies: mine,
      store_cookies: storeCookies,
      protectedSite: mine.filter(c => isProtected(map, c)).length,
      protectedStore: storeCookies.filter(c => isProtected(map, c)).length,
      storageItems: host && tab.id !== undefined ? await countStorage(tab.id) : null
    });
  };

  useEffect(() => {
    void load();
  }, [access]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      await load();
    }
  };

  const deleteCookies = (list: Cookie[]) => run(async () => {
    const map = await getProtected();
    const removedList = list.filter(c => !isProtected(map, c));
    const r = await deleteUnprotected(list);
    setUndo(removedList.length ? removedList : null);
    setMessage(t("deletedCount", r.removed) + (r.kept ? " " + t("keptProtected", r.kept) : ""));
    setConfirmStore(false);
  });

  const restore = () => run(async () => {
    const list = undo || [];
    let n = 0;
    for (const c of list) {
      try {
        await setCookie(c);
        n++;
      } catch {
        /* expired meanwhile */
      }
    }
    setUndo(null);
    setMessage(t("restoredCount", n));
  });

  const open = async (search?: string) => {
    await openManager({ search, store: search ? info?.storeId : undefined });
    window.close();
  };

  const options = () => {
    void ext.runtime.openOptionsPage();
    window.close();
  };

  const count = (n: number) => <span class="count">{n > 999 ? "999+" : n}</span>;

  return (
    <main>
      <header class="pop-head">
        <img src="/icons/icon.svg" alt="" width="22" height="22" />
        <strong>CookieTin</strong>
        <span class="grow" />
        <button class="icon" title={t("settings")} onClick={options}><GearIcon /></button>
      </header>

      {access === false && <AccessBanner onGrant={grant} />}

      {info && (
        <>
          <div class="site">
            {info.host ? (
              <>
                {info.tab.favIconUrl && !info.tab.favIconUrl.startsWith("chrome:") ? <img src={info.tab.favIconUrl} alt="" width="16" height="16" /> : <span class="fav" />}
                <span class="host" title={info.host}>{info.host}</span>
              </>
            ) : (
              <span class="muted">{t("noSiteHere")}</span>
            )}
            {info.store && info.store.kind !== "default" && <StoreBadge store={info.store} />}
          </div>

          <nav class="menu">
            {info.site && (
              <button class="item" id="manage-site" onClick={() => open(info.site)}>
                <SearchIcon />
                <span class="label">{t("popupManageSite", info.site)}</span>
                {count(info.site_cookies.length)}
              </button>
            )}
            <button class="item" id="open-manager" onClick={() => open()}>
              <WindowIcon />
              <span class="label">{t("popupOpenManager")}</span>
            </button>

            {info.site && (
              <button class="item danger" id="delete-site" disabled={busy || !info.site_cookies.length} onClick={() => deleteCookies(info.site_cookies)}>
                <TrashIcon />
                <span class="label">
                  {t("popupDeleteSite", info.site)}
                  {info.protectedSite > 0 && <small>{t("protectedStay", info.protectedSite)}</small>}
                </span>
                {count(info.site_cookies.length)}
              </button>
            )}

            {info.host && (
              <button class="item danger" id="clear-storage" disabled={busy} onClick={() => run(async () => {
                await clearSiteData(info.tab, info.host);
                setMessage(t("storageCleared"));
                setUndo(null);
              })}>
                <BroomIcon />
                <span class="label">
                  {t("popupClearStorage")}
                  <small>{t("popupClearStorageHint")}</small>
                </span>
                {info.storageItems !== null && count(info.storageItems)}
              </button>
            )}

            {settings.showStoreDelete && (
              <button class={"item danger" + (confirmStore ? " confirm" : "")} id="delete-store" disabled={busy || !info.store_cookies.length}
                onClick={() => {
                  if (settings.confirmBulk && !confirmStore) setConfirmStore(true);
                  else void deleteCookies(info.store_cookies);
                }}>
                <TrashIcon />
                <span class="label">
                  {confirmStore ? t("popupConfirmStore", info.store_cookies.length - info.protectedStore)
                    : t("popupDeleteStore", info.store?.name || t("storeDefault"))}
                  {!confirmStore && info.protectedStore > 0 && <small>{t("protectedStay", info.protectedStore)}</small>}
                </span>
                {count(info.store_cookies.length)}
              </button>
            )}
          </nav>

          {message && (
            <div class="note" role="status">
              <span>{message}</span>
              {undo && <button class="link" id="undo" onClick={restore}>{t("undo")}</button>}
            </div>
          )}
        </>
      )}

      <footer class="pop-foot">
        <a href={ext.runtime.getURL("options/options.html#support")} target="_blank" onClick={() => setTimeout(() => window.close(), 50)}>
          <HeartIcon /> {t("support")}
        </a>
      </footer>
    </main>
  );
}

localizePage();
render(<Popup />, document.getElementById("app")!);
