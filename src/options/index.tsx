/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { ext, isFirefox, t } from "../shared/api";
import { MIGRATED_KEY, restoreBackup } from "../shared/backup";
import { countProtected, getProtected, onProtectedChanged, saveProtected, withProtection, type ProtectedMap } from "../shared/protect";
import { getSettings, type ExportFormat, type Settings } from "../shared/settings";
import { Footer, SupportSection, downloadText, localizePage, pickTextFile, useSettings, useTheme } from "../ui/common";
import { LockIcon, UnlockIcon } from "../ui/icons";

function Check(p: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label class="check">
      <input type="checkbox" id={p.id} checked={p.checked} onChange={e => p.onChange((e.target as HTMLInputElement).checked)} />
      <span>{p.label}{p.hint && <span class="muted">{p.hint}</span>}</span>
    </label>
  );
}

function ProtectedList() {
  const [map, setMap] = useState<ProtectedMap>({});
  useEffect(() => {
    void getProtected().then(setMap);
    return onProtectedChanged(setMap);
  }, []);
  const domains = Object.keys(map).sort();
  const remove = (domain: string, name?: string) => {
    const names = name ? [name] : map[domain];
    void saveProtected(withProtection(map, names.map(n => ({ domain, name: n })), false));
  };
  if (!domains.length) return <p class="muted" id="protected-empty">{t("noProtected")}</p>;
  return (
    <div class="protected" id="protected-list">
      {domains.map(d => (
        <div class="prot-domain">
          <div class="prot-head">
            <LockIcon />
            <strong>{d}</strong>
            <span class="grow" />
            <button class="icon" title={t("unprotectDomain")} onClick={() => remove(d)}><UnlockIcon /></button>
          </div>
          <div class="prot-names">
            {map[d].map(n => (
              <span class="prot-name">
                <code>{n}</code>
                <button class="x" title={t("unprotect")} onClick={() => remove(d, n)}>×</button>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Options() {
  const [s, update] = useSettings();
  useTheme(s.theme);
  const [protectedCount, setProtectedCount] = useState(0);
  const [status, setStatus] = useState<{ text: string; error?: boolean }>({ text: "" });
  const [privateAllowed, setPrivateAllowed] = useState<boolean | null>(null);
  const [migrated, setMigrated] = useState<number | null>(null);

  useEffect(() => {
    void getProtected().then(m => setProtectedCount(countProtected(m)));
    const off = onProtectedChanged(m => setProtectedCount(countProtected(m)));
    ext.extension.isAllowedIncognitoAccess().then(setPrivateAllowed, () => setPrivateAllowed(null));
    void ext.storage.local.get(MIGRATED_KEY).then(got => typeof got[MIGRATED_KEY] === "number" && setMigrated(got[MIGRATED_KEY] as number));
    if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView(), 50);
    return off;
  }, []);

  const backup = async () => {
    const data = { app: "CookieTin", version: ext.runtime.getManifest().version, settings: await getSettings(), protected_cookies: await getProtected() };
    downloadText("cookietin-settings.json", JSON.stringify(data, null, 2), "application/json");
  };

  const restore = async () => {
    const text = await pickTextFile(".json,application/json");
    if (text === null) return;
    try {
      const n = await restoreBackup(text);
      setStatus({ text: t("restoreDone", n) });
    } catch {
      setStatus({ text: t("restoreFailed"), error: true });
    }
  };

  const reset = async () => {
    if (!window.confirm(t("resetConfirm"))) return;
    await ext.storage.local.clear();
    setStatus({ text: t("resetDone") });
  };

  return (
    <div class="wrap">
      <header class="top">
        <img src="/icons/icon.svg" alt="" />
        <div>
          <h1>CookieTin</h1>
          <div class="sub">{t("optionsTitle")} · v{ext.runtime.getManifest().version}</div>
        </div>
        <div class="right">
          <a href={ext.runtime.getURL("manager/manager.html")}>{t("popupOpenManager")}</a>
          <a href="#support">♥ {t("support")}</a>
        </div>
      </header>

      {migrated !== null && (
        <section class="card hi" id="welcome">
          <h2>{t("welcomeTitle")}</h2>
          <p>{t("welcomeText", migrated)}</p>
          <p class="muted">{t("welcomeNew")}</p>
          <div class="row">
            <button id="welcome-ok" onClick={() => {
              void ext.storage.local.remove(MIGRATED_KEY);
              setMigrated(null);
            }}>{t("welcomeOk")}</button>
            <a href="https://github.com/Perruer/cookietin/blob/main/CHANGELOG.md" target="_blank" rel="noopener">{t("welcomeChanges")}</a>
          </div>
        </section>
      )}

      <section class="card">
        <h2>{t("secCleanup")}</h2>
        <Check id="opt-startup" checked={s.deleteOnStartup} onChange={v => update({ deleteOnStartup: v })}
          label={t("optDeleteOnStartup")} hint={t("optDeleteOnStartupHint")} />
        <div class="field">
          <label for="opt-cleanup">{t("optCleanup")}</label>
          <select id="opt-cleanup" value={String(s.cleanupHours)} onChange={e => update({ cleanupHours: Number((e.target as HTMLSelectElement).value) })} style={{ width: "auto" }}>
            <option value="0">{t("cleanupOff")}</option>
            {[1, 3, 6, 12, 24].map(h => <option value={String(h)}>{t("cleanupEvery", h)}</option>)}
          </select>
        </div>
        {s.cleanupHours > 0 && (
          <Check id="opt-keep-open" checked={s.cleanupKeepOpenTabs} onChange={v => update({ cleanupKeepOpenTabs: v })}
            label={t("optKeepOpenTabs")} hint={t("optKeepOpenTabsHint")} />
        )}
        <p class="muted small">{t("cleanupNote")}</p>
      </section>

      <section class="card" id="protection">
        <h2>{t("secProtection")} <span class="pill">{protectedCount}</span></h2>
        <p class="muted">{t("protectionText")}</p>
        <Check id="opt-guard" checked={s.guardProtected} onChange={v => update({ guardProtected: v })}
          label={t("optGuard")} hint={t("optGuardHint")} />
        <ProtectedList />
      </section>

      <section class="card">
        <h2>{t("secInterface")}</h2>
        <div class="field">
          <label for="opt-open">{t("optOpenIn")}</label>
          <select id="opt-open" value={s.openIn} onChange={e => update({ openIn: (e.target as HTMLSelectElement).value as Settings["openIn"] })}>
            <option value="tab">{t("openTab")}</option>
            <option value="window">{t("openWindow")}</option>
          </select>
          <label for="opt-theme">{t("optTheme")}</label>
          <select id="opt-theme" value={s.theme} onChange={e => update({ theme: (e.target as HTMLSelectElement).value as Settings["theme"] })}>
            <option value="auto">{t("themeAuto")}</option>
            <option value="light">{t("themeLight")}</option>
            <option value="dark">{t("themeDark")}</option>
          </select>
          <label for="opt-format">{t("optExportFormat")}</label>
          <select id="opt-format" value={s.exportFormat} onChange={e => update({ exportFormat: (e.target as HTMLSelectElement).value as ExportFormat })}>
            <option value="json">{t("formatJson")}</option>
            <option value="netscape">{t("formatNetscape")}</option>
            <option value="header">{t("formatHeader")}</option>
            <option value="cqm">{t("formatCqm")}</option>
          </select>
        </div>
        <Check id="opt-confirm" checked={s.confirmBulk} onChange={v => update({ confirmBulk: v })} label={t("optConfirm")} />
        <Check id="opt-store-delete" checked={s.showStoreDelete} onChange={v => update({ showStoreDelete: v })}
          label={t("optShowStoreDelete")} hint={t("optShowStoreDeleteHint")} />
        <Check id="opt-live" checked={s.autoRefresh} onChange={v => update({ autoRefresh: v })} label={t("optAutoRefresh")} />
      </section>

      <section class="card">
        <h2>{t("secPrivate")}</h2>
        <p class="muted">
          {privateAllowed ? t("privateAllowed") : isFirefox ? t("privateHowFirefox") : t("privateHowChrome")}
        </p>
      </section>

      <section class="card" id="backup">
        <h2>{t("secBackup")}</h2>
        <p class="muted">{t("backupText")}</p>
        <div class="row">
          <button class="secondary" id="backup-save" onClick={backup}>{t("backupSave")}</button>
          <button class="secondary" id="backup-restore" onClick={restore}>{t("backupRestore")}</button>
          <span class="grow" />
          <button class="danger" id="reset" onClick={reset}>{t("reset")}</button>
        </div>
        <div class={"status" + (status.error ? " error" : status.text ? " ok" : "")} id="backup-status">{status.text}</div>
        <p class="muted small">{t("migrateText")}</p>
      </section>

      <SupportSection />
      <Footer />
    </div>
  );
}

E2E: {
  // Test hook: restore a backup without a file picker.
  (globalThis as any).__ctRestore = restoreBackup;
}

localizePage();
render(<Options />, document.getElementById("app")!);
