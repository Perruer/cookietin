/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { render } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { ext, t } from "../shared/api";
import { cleanAll, deleteUnprotected } from "../shared/cleanup";
import {
  cookieKey, copyCookies, isPartitioned, listCookies, replaceCookie, setCookie, type Cookie
} from "../shared/cookies";
import { bareDomain, baseDomain, siteHost } from "../shared/domain";
import { getProtected, isProtected, onProtectedChanged, setProtection, type ProtectedMap } from "../shared/protect";
import { isEmptyQuery, matchesCookie, parseQuery } from "../shared/search";
import { defaultStoreId, listStores, type Store } from "../shared/stores";
import { AccessBanner, REPO_URL, StoreBadge, localizePage, useHostAccess, useSettings, useTheme } from "../ui/common";
import {
  ContainerIcon, DownloadIcon, GearIcon, HeartIcon, LockIcon, PlusIcon, EmbedIcon, RefreshIcon, SearchIcon, TrashIcon, UnlockIcon, UploadIcon
} from "../ui/icons";
import { ConfirmDialog, ExportDialog, ImportDialog } from "./dialogs";
import { cookieFromDraft, draftFromCookie, newDraft, type Draft } from "./draft";
import { Editor } from "./Editor";

type Kind = "all" | "session" | "persistent" | "protected" | "partitioned" | "httponly" | "insecure";

type Dialog =
  | { type: "export" }
  | { type: "import" }
  | { type: "confirm"; text: string; yes: string; onYes: () => void };

interface Editing {
  original: Cookie | null;
  draft: Draft;
  dirty: boolean;
  error: string;
}

/** Rendering thousands of rows makes the page sluggish; the search narrows it. */
const MAX_ROWS = 1500;

const params = new URLSearchParams(location.search);

/** Sort key that groups subdomains under their site: "example.com www". */
function domainSortKey(domain: string): string {
  const base = baseDomain(domain);
  return base + " " + domain.slice(0, Math.max(0, domain.length - base.length));
}

function inSelection(c: Cookie, selected: string[], subdomains: boolean): boolean {
  if (!selected.length) return true;
  const d = bareDomain(c.domain);
  return selected.some(s => d === s || (subdomains && d.endsWith("." + s)));
}

function matchesKind(c: Cookie, kind: Kind, map: ProtectedMap): boolean {
  switch (kind) {
    case "session": return c.session;
    case "persistent": return !c.session;
    case "protected": return isProtected(map, c);
    case "partitioned": return isPartitioned(c);
    case "httponly": return c.httpOnly;
    case "insecure": return !c.secure;
    default: return true;
  }
}

/** Click selection with Ctrl/Cmd (toggle) and Shift (range). */
function nextSelection<T>(items: T[], current: T[], item: T, anchor: T | null, e: MouseEvent, keepSingle = false): T[] {
  if (e.shiftKey && anchor !== null) {
    const a = items.indexOf(anchor);
    const b = items.indexOf(item);
    if (a !== -1 && b !== -1) {
      const range = items.slice(Math.min(a, b), Math.max(a, b) + 1);
      return e.ctrlKey || e.metaKey ? [...new Set([...current, ...range])] : range;
    }
  }
  if (e.ctrlKey || e.metaKey) return current.includes(item) ? current.filter(x => x !== item) : [...current, item];
  if (keepSingle && current.length === 1 && current[0] === item) return current;
  return [item];
}

function App() {
  const [settings, updateSettings, settingsLoaded] = useSettings();
  useTheme(settings.theme);
  const [access, grant] = useHostAccess();

  const [stores, setStores] = useState<Store[]>([]);
  const [storeFilter, setStoreFilter] = useState(params.get("store") || "all");
  const [cookies, setCookies] = useState<Cookie[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState(params.get("q") || "");
  const [protectedMap, setProtectedMap] = useState<ProtectedMap>({});
  const [selDomains, setSelDomains] = useState<string[]>([]);
  const [domainAnchor, setDomainAnchor] = useState<string | null>(null);
  const [kind, setKind] = useState<Kind>("all");
  const [selKeys, setSelKeys] = useState<string[]>([]);
  const [cookieAnchor, setCookieAnchor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: Cookie[] } | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [copyTarget, setCopyTarget] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef<Editing | null>(null);
  editingRef.current = editing;

  // ------------------------------------------------------------ data

  const reload = useCallback(async () => {
    const st = await listStores();
    setStores(st);
    const ids = storeFilter === "all" ? st.map(s => s.id) : [storeFilter];
    const list = await listCookies(ids);
    list.sort((a, b) => domainSortKey(bareDomain(a.domain)).localeCompare(domainSortKey(bareDomain(b.domain))) || a.name.localeCompare(b.name));
    setCookies(list);
    setLoaded(true);
    // Keep the editor in sync with the browser unless the user is typing.
    const ed = editingRef.current;
    if (ed?.original && !ed.dirty) {
      const key = cookieKey(ed.original);
      const fresh = list.find(c => cookieKey(c) === key);
      if (!fresh) setEditing(null);
      else if (fresh.value !== ed.original.value || fresh.expirationDate !== ed.original.expirationDate) {
        setEditing({ original: fresh, draft: draftFromCookie(fresh), dirty: false, error: "" });
      }
    }
  }, [storeFilter]);

  useEffect(() => {
    void reload();
  }, [reload, access]);

  useEffect(() => {
    void getProtected().then(setProtectedMap);
    return onProtectedChanged(setProtectedMap);
  }, []);

  // Live updates when cookies change in the browser.
  useEffect(() => {
    if (!settings.autoRefresh) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const listener = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void reload(), 400);
    };
    ext.cookies.onChanged.addListener(listener);
    return () => {
      clearTimeout(timer);
      ext.cookies.onChanged.removeListener(listener);
    };
  }, [settings.autoRefresh, reload]);

  // Remember the size of the manager window.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let isPopup = false;
    ext.windows?.getCurrent?.().then(w => (isPopup = w.type === "popup"), () => {});
    const onResize = () => {
      if (!isPopup) return;
      clearTimeout(timer);
      timer = setTimeout(() => updateSettings({ windowWidth: window.outerWidth, windowHeight: window.outerHeight }), 600);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ------------------------------------------------------------ derived

  const query = useMemo(() => parseQuery(search), [search]);
  const storeById = useMemo(() => new Map(stores.map(s => [s.id, s])), [stores]);
  const visible = useMemo(() => cookies.filter(c => matchesCookie(c, query)), [cookies, query]);

  const domains = useMemo(() => {
    const groups = new Map<string, Cookie[]>();
    for (const c of visible) {
      const d = bareDomain(c.domain);
      const g = groups.get(d);
      if (g) g.push(c);
      else groups.set(d, [c]);
    }
    return [...groups.entries()].map(([domain, list]) => ({
      domain,
      list,
      stores: [...new Set(list.map(c => c.storeId))],
      protected: list.some(c => isProtected(protectedMap, c)),
      partitioned: list.filter(isPartitioned).map(c => siteHost(c.partitionKey!.topLevelSite))
    }));
  }, [visible, protectedMap]);

  const domainNames = useMemo(() => domains.map(d => d.domain), [domains]);
  const activeDomains = useMemo(() => selDomains.filter(d => domainNames.includes(d)), [selDomains, domainNames]);

  const listed = useMemo(
    () => visible.filter(c => inSelection(c, activeDomains, settings.includeSubdomains) && matchesKind(c, kind, protectedMap)),
    [visible, activeDomains, settings.includeSubdomains, kind, protectedMap]
  );
  const listedKeys = useMemo(() => listed.map(cookieKey), [listed]);
  const byKey = useMemo(() => new Map(cookies.map(c => [cookieKey(c), c])), [cookies]);
  const selected = useMemo(() => selKeys.map(k => byKey.get(k)).filter((c): c is Cookie => !!c && listedKeys.includes(cookieKey(c))), [selKeys, byKey, listedKeys]);

  // First load: a site search from the popup selects its domains; otherwise
  // the first domain is selected, like Cookie Quick Manager did.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !loaded) return;
    initialized.current = true;
    if (!search && domainNames.length) setSelDomains([domainNames[0]]);
  }, [loaded, domainNames]);

  // ------------------------------------------------------------ actions

  const showToast = (text: string, undo?: Cookie[]) => setToast({ text, undo });
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), toast.undo ? 10000 : 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const openCookie = (c: Cookie) => {
    setEditing({ original: c, draft: draftFromCookie(c), dirty: false, error: "" });
  };

  const confirmDiscard = () => !editing?.dirty || window.confirm(t("discardChanges"));

  const clickCookie = (c: Cookie, e: MouseEvent) => {
    const key = cookieKey(c);
    const next = nextSelection(listedKeys, selKeys.filter(k => listedKeys.includes(k)), key, cookieAnchor, e);
    if (!e.shiftKey) setCookieAnchor(key);
    if (next.length === 1) {
      if (editing?.original && cookieKey(editing.original) === next[0]) {
        setSelKeys(next);
        return;
      }
      if (!confirmDiscard()) return;
      openCookie(byKey.get(next[0])!);
    } else if (editing?.dirty && !confirmDiscard()) {
      return;
    } else {
      setEditing(null);
    }
    setSelKeys(next);
  };

  const toggleCookie = (c: Cookie) => {
    const key = cookieKey(c);
    const current = selKeys.filter(k => listedKeys.includes(k));
    const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
    setSelKeys(next);
    setCookieAnchor(key);
    if (next.length === 1 && !editing?.dirty) openCookie(byKey.get(next[0])!);
    else if (next.length !== 1 && !editing?.dirty) setEditing(null);
  };

  const selectAllCookies = () => {
    const all = selected.length === listed.length && listed.length > 0;
    setSelKeys(all ? [] : listedKeys);
    if (!editing?.dirty) setEditing(null);
  };

  const clickDomain = (domain: string, e: MouseEvent) => {
    const next = nextSelection(domainNames, activeDomains, domain, domainAnchor, e);
    if (!e.shiftKey) setDomainAnchor(domain);
    setSelDomains(next);
    setSelKeys([]);
    if (!editing?.dirty) setEditing(null);
  };

  const doDelete = async (targets: Cookie[]) => {
    const map = await getProtected();
    const removable = targets.filter(c => !isProtected(map, c));
    const r = await deleteUnprotected(targets);
    setSelKeys([]);
    if (editing?.original && removable.some(c => cookieKey(c) === cookieKey(editing.original!))) setEditing(null);
    showToast(t("deletedCount", r.removed) + (r.kept ? " " + t("keptProtected", r.kept) : "") + (r.failed ? " " + t("deleteFailed", r.failed) : ""),
      removable.length ? removable : undefined);
    await reload();
  };

  const requestDelete = (targets: Cookie[]) => {
    if (!targets.length) return;
    const protectedCount = targets.filter(c => isProtected(protectedMap, c)).length;
    if (protectedCount === targets.length) {
      showToast(t("allProtected"));
      return;
    }
    if (settings.confirmBulk && targets.length > 1) {
      setDialog({
        type: "confirm",
        text: t("confirmDelete", targets.length - protectedCount) + (protectedCount ? " " + t("keptProtected", protectedCount) : ""),
        yes: t("delete"),
        onYes: () => void doDelete(targets)
      });
    } else {
      void doDelete(targets);
    }
  };

  const undo = async (list: Cookie[]) => {
    let n = 0;
    for (const c of list) {
      try {
        await setCookie(c);
        n++;
      } catch {
        /* expired meanwhile */
      }
    }
    showToast(t("restoredCount", n));
    await reload();
  };

  const protect = async (targets: Cookie[], flag: boolean) => {
    if (!targets.length) return;
    await setProtection(targets, flag);
    showToast(t(flag ? "protectedCount" : "unprotectedCount", targets.length));
  };

  const copyTo = async (storeId: string) => {
    if (!storeId || !selected.length) return;
    const r = await copyCookies(selected, storeId);
    showToast(t("copiedToStore", [r.copied, storeById.get(storeId)?.name || storeId]) + (r.failed ? " " + t("deleteFailed", r.failed) : ""));
    setCopyTarget("");
    await reload();
  };

  const newCookie = () => {
    if (!confirmDiscard()) return;
    const domain = activeDomains[0] || (!isEmptyQuery(query) ? query.domains[0] || "" : "");
    const storeId = storeFilter !== "all" ? storeFilter : defaultStoreId();
    setSelKeys([]);
    setEditing({ original: null, draft: newDraft(domain, storeId), dirty: true, error: "" });
    setTimeout(() => document.getElementById("f-name")?.focus(), 0);
  };

  const save = async () => {
    const ed = editingRef.current;
    if (!ed) return;
    const next = cookieFromDraft(ed.draft);
    const prev = ed.original;
    const wasProtected = prev ? isProtected(protectedMap, prev) : false;
    try {
      // Moving a protected cookie: lift the protection first, or the
      // background guard would put the old one back.
      if (prev && wasProtected) await setProtection([prev], false);
      const saved = await replaceCookie(prev, next);
      if (wasProtected) await setProtection([saved], true);
      setEditing({ original: saved, draft: draftFromCookie(saved), dirty: false, error: "" });
      setSelKeys([cookieKey(saved)]);
      const d = bareDomain(saved.domain);
      if (activeDomains.length && !inSelection(saved, activeDomains, settings.includeSubdomains)) setSelDomains([...activeDomains, d]);
      showToast(t("saved"));
      await reload();
    } catch (e) {
      if (prev && wasProtected) await setProtection([prev], true);
      setEditing({ ...ed, error: t("saveFailed", (e as Error).message || String(e)) });
    }
  };

  const duplicate = () => {
    if (!editing) return;
    setSelKeys([]);
    setEditing({ original: null, draft: { ...editing.draft, name: editing.draft.name + "_copy" }, dirty: true, error: "" });
    setTimeout(() => (document.getElementById("f-name") as HTMLInputElement | null)?.select(), 0);
  };

  // ------------------------------------------------------------ keyboard

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable;
      const mod = e.ctrlKey || e.metaKey;
      if (dialog) {
        if (e.key === "Escape") setDialog(null);
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (editingRef.current) void save();
      } else if ((mod && e.key.toLowerCase() === "f") || (!typing && e.key === "/")) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (!typing && (e.key === "Delete" || (e.key === "Backspace" && mod))) {
        e.preventDefault();
        requestDelete(selected);
      } else if (!typing && mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelKeys(listedKeys);
        if (!editing?.dirty) setEditing(null);
      } else if (e.key === "Escape" && !typing) {
        setSelKeys([]);
        if (!editing?.dirty) setEditing(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ------------------------------------------------------------ render

  const multiStore = stores.length > 1;
  const allChecked = listed.length > 0 && selected.length === listed.length;
  const rows = listed.slice(0, MAX_ROWS);
  const editingKey = editing?.original ? cookieKey(editing.original) : "";
  const selectedProtected = selected.filter(c => isProtected(protectedMap, c)).length;

  return (
    <div class="app">
      <header class="topbar">
        <a class="brand" href={REPO_URL} target="_blank" rel="noopener" title="CookieTin">
          <img src="/icons/icon.svg" alt="" width="26" height="26" />
          <strong>CookieTin</strong>
        </a>
        <label class="search">
          <SearchIcon />
          <input ref={searchRef} type="search" id="search" value={search} placeholder={t("searchPlaceholder")} spellcheck={false}
            onInput={e => {
              setSearch((e.target as HTMLInputElement).value);
              setSelDomains([]);
              setSelKeys([]);
            }} />
        </label>
        <select id="store-filter" class="store-select" value={storeFilter} title={t("fieldStore")}
          onChange={e => {
            setStoreFilter((e.target as HTMLSelectElement).value);
            setSelKeys([]);
          }}>
          <option value="all">{t("allStores")}</option>
          {stores.map(s => <option value={s.id}>{s.name}</option>)}
        </select>
        <label class="check inline small" title={t("subdomainsHint")}>
          <input type="checkbox" id="subdomains" checked={settings.includeSubdomains} onChange={e => updateSettings({ includeSubdomains: (e.target as HTMLInputElement).checked })} />
          <span>{t("subdomains")}</span>
        </label>
        <span class="grow" />
        <button class="secondary" id="new-cookie" onClick={newCookie}><PlusIcon /> {t("newCookieShort")}</button>
        <button class="secondary" id="import" onClick={() => setDialog({ type: "import" })}><UploadIcon /> {t("import")}</button>
        <button class="secondary" id="export" onClick={() => setDialog({ type: "export" })} disabled={!visible.length}><DownloadIcon /> {t("export")}</button>
        <button class="icon" id="refresh" title={t("refresh")} onClick={() => void reload()}><RefreshIcon /></button>
        <a class="icon-link" href={ext.runtime.getURL("options/options.html")} target="_blank" title={t("settings")}><GearIcon /></a>
        <a class="icon-link support" href={ext.runtime.getURL("options/options.html#support")} target="_blank" title={t("support")}><HeartIcon /></a>
      </header>

      {access === false && <div class="banner-wrap"><AccessBanner onGrant={grant} /></div>}

      <main class="cols">
        <section class="col domains" aria-label={t("domains")}>
          <div class="col-head">
            <h2>{t("domains")} <span class="count">{domains.length}</span></h2>
            {activeDomains.length > 0 && (
              <button class="link small" id="clear-domains" onClick={() => {
                setSelDomains([]);
                setSelKeys([]);
              }}>{t("showAll")}</button>
            )}
          </div>
          <ul class="list" id="domain-list" role="listbox" aria-multiselectable="true">
            {domains.map(d => (
              <li role="option" aria-selected={activeDomains.includes(d.domain)} class={activeDomains.includes(d.domain) ? "sel" : ""}
                data-domain={d.domain} onClick={e => clickDomain(d.domain, e)} title={d.domain}>
                <span class="name">{d.domain}</span>
                {d.partitioned.length > 0 && <span class="tag" title={t("partitionedIn", [...new Set(d.partitioned)].join(", "))}><EmbedIcon /></span>}
                {d.protected && <span class="tag" title={t("hasProtected")}><LockIcon /></span>}
                {multiStore && storeFilter === "all" && d.stores.map(id => <StoreBadge store={storeById.get(id)} label={false} />)}
                <span class="count">{d.list.length}</span>
              </li>
            ))}
            {loaded && !domains.length && <li class="empty">{cookies.length ? t("nothingFound") : t("noCookies")}</li>}
          </ul>
        </section>

        <section class="col cookies" aria-label={t("cookies")}>
          <div class="col-head">
            <label class="check inline" title={t("selectAll")}>
              <input type="checkbox" id="select-all" checked={allChecked} disabled={!listed.length}
                ref={el => {
                  if (el) el.indeterminate = selected.length > 0 && !allChecked;
                }} onChange={selectAllCookies} />
            </label>
            <h2>{t("cookies")} <span class="count" id="cookie-count">{listed.length}</span></h2>
            <select id="kind-filter" class="mini" value={kind} onChange={e => {
              setKind((e.target as HTMLSelectElement).value as Kind);
              setSelKeys([]);
            }}>
              <option value="all">{t("kindAll")}</option>
              <option value="session">{t("kindSession")}</option>
              <option value="persistent">{t("kindPersistent")}</option>
              <option value="protected">{t("kindProtected")}</option>
              <option value="partitioned">{t("kindPartitioned")}</option>
              <option value="httponly">HttpOnly</option>
              <option value="insecure">{t("kindInsecure")}</option>
            </select>
          </div>
          {selected.length > 1 && (
            <div class="bulk" id="bulk">
              <span class="small"><strong>{t("selectedCount", selected.length)}</strong></span>
              <button class="danger small-btn" id="bulk-delete" onClick={() => requestDelete(selected)} title="Delete"><TrashIcon /> {t("delete")}</button>
              {selectedProtected < selected.length && <button class="secondary small-btn" id="bulk-protect" onClick={() => void protect(selected, true)}><LockIcon /> {t("protect")}</button>}
              {selectedProtected > 0 && <button class="secondary small-btn" id="bulk-unprotect" onClick={() => void protect(selected, false)}><UnlockIcon /> {t("unprotect")}</button>}
              <button class="secondary small-btn" onClick={() => setDialog({ type: "export" })}><DownloadIcon /> {t("export")}</button>
              {multiStore && (
                <label class="copy-to" title={t("copyToHint")}>
                  <ContainerIcon />
                  <select id="copy-to" class="mini" value={copyTarget} onChange={e => void copyTo((e.target as HTMLSelectElement).value)}>
                    <option value="">{t("copyTo")}</option>
                    {stores.map(s => <option value={s.id}>{s.name}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}
          <ul class="list" id="cookie-list" role="listbox" aria-multiselectable="true">
            {rows.map(c => {
              const key = cookieKey(c);
              const isSel = selected.some(s => cookieKey(s) === key);
              const prot = isProtected(protectedMap, c);
              return (
                <li role="option" aria-selected={isSel} class={(isSel ? "sel" : "") + (key === editingKey ? " open" : "")}
                  data-name={c.name} data-domain={c.domain} onClick={e => clickCookie(c, e)}>
                  <input type="checkbox" checked={isSel} tabIndex={-1} aria-label={t("select")}
                    onClick={e => {
                      e.stopPropagation();
                      toggleCookie(c);
                    }} />
                  <div class="cookie-main">
                    <div class="cookie-name">
                      <span class="name">{c.name || <em>{t("noName")}</em>}</span>
                      {prot && <span class="tag" title={t("protected")}><LockIcon /></span>}
                      {isPartitioned(c) && <span class="tag part" title={t("partitionedIn", siteHost(c.partitionKey!.topLevelSite))}><EmbedIcon /> {baseDomain(siteHost(c.partitionKey!.topLevelSite))}</span>}
                      {multiStore && <StoreBadge store={storeById.get(c.storeId)} label={false} />}
                    </div>
                    <div class="cookie-sub">
                      {(activeDomains.length !== 1 || settings.includeSubdomains) && <span class="dom">{c.domain}</span>}
                      <span class="val">{c.value.slice(0, 120)}</span>
                    </div>
                  </div>
                </li>
              );
            })}
            {listed.length > MAX_ROWS && <li class="empty">{t("tooMany", MAX_ROWS)}</li>}
            {loaded && !listed.length && <li class="empty">{t("noCookiesHere")}</li>}
          </ul>
        </section>

        <section class="col details" aria-label={t("details")}>
          {editing ? (
            <Editor
              draft={editing.draft}
              original={editing.original}
              dirty={editing.dirty}
              stores={stores}
              isProtected={!!editing.original && isProtected(protectedMap, editing.original)}
              error={editing.error}
              onChange={patch => setEditing(ed => ed && { ...ed, draft: { ...ed.draft, ...patch }, dirty: true, error: "" })}
              onSave={() => void save()}
              onDelete={() => editing.original && requestDelete([editing.original])}
              onDuplicate={duplicate}
              onProtect={() => editing.original && void protect([editing.original], !isProtected(protectedMap, editing.original))}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <div class="placeholder">
              {selected.length > 1 ? (
                <>
                  <p><strong>{t("selectedCount", selected.length)}</strong></p>
                  <p class="muted">{t("bulkHint")}</p>
                </>
              ) : (
                <>
                  <p class="muted">{t("pickCookie")}</p>
                  <p class="muted small">{t("shortcutsHint")}</p>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {toast && (
        <div class="toast" role="status" id="toast">
          <span>{toast.text}</span>
          {toast.undo && <button class="link" id="toast-undo" onClick={() => {
            const list = toast.undo!;
            setToast(null);
            void undo(list);
          }}>{t("undo")}</button>}
        </div>
      )}

      {dialog?.type === "confirm" && <ConfirmDialog text={dialog.text} yes={dialog.yes} onYes={dialog.onYes} onClose={() => setDialog(null)} />}
      {dialog?.type === "export" && settingsLoaded && (
        <ExportDialog selected={selected} list={listed} all={visible} format={settings.exportFormat}
          onFormat={f => updateSettings({ exportFormat: f })} onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "import" && (
        <ImportDialog stores={stores} defaultStore={storeFilter !== "all" ? storeFilter : "file"}
          onDone={msg => {
            setDialog(null);
            showToast(msg);
            void reload();
          }} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

E2E: {
  // Test hook: periodic cleanup without waiting for the alarm.
  (globalThis as any).__ctCleanup = (keepOpenTabs: boolean) => cleanAll(keepOpenTabs);
}

localizePage();
render(<App />, document.getElementById("app")!);
