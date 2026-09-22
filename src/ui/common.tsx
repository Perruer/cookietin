/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { useEffect, useState } from "preact/hooks";
import { ext, t, uiLanguage } from "../shared/api";
import type { Store } from "../shared/stores";
import { DEFAULT_SETTINGS, getSettings, onSettingsChanged, saveSettings, type Settings } from "../shared/settings";

export const REPO_URL = "https://github.com/Perruer/cookietin";
export const BOOSTY_URL = "https://boosty.to/mikio_kuroki/donate";
export const ORIGINAL_URL = "https://github.com/ysard/cookie-quick-manager";

export const WALLETS = [
  { network: "TRON (TRC-20)", coins: "USDT, TRX", address: "TXUBW4e88SDTfrnJRKfbhYfFcggufbonc1" },
  { network: "Ethereum / EVM (ERC-20)", coins: "USDT, USDC, ETH", address: "0x1378491169064702786b2E5b58c6375776177E8A" },
  { network: "TON", coins: "TON, USDT", address: "UQAhI7EKzoa-JuKOfv0ULMzA3FrmpxsDkXj8Qevwj2z1cMRN" }
];

/** Applies localized strings to data-i18n elements of the static HTML. */
export function localizePage() {
  document.documentElement.lang = uiLanguage().split("-")[0];
  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const msg = ext.i18n.getMessage(el.dataset.i18n!);
    if (msg) el.textContent = msg;
  }
}

export function useSettings(): [Settings, (patch: Partial<Settings>) => void, boolean] {
  const [settings, set] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    getSettings().then(s => {
      set(s);
      setLoaded(true);
    });
    return onSettingsChanged(set);
  }, []);
  const update = (patch: Partial<Settings>) => {
    set(s => ({ ...s, ...patch }));
    void saveSettings(patch);
  };
  return [settings, update, loaded];
}

/** Applies the theme setting to the page. */
export function useTheme(theme: Settings["theme"]) {
  useEffect(() => {
    if (theme === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = theme;
  }, [theme]);
}

/** Colored container/profile badge. */
export function StoreBadge({ store, label = true }: { store: Store | undefined; label?: boolean }) {
  if (!store) return null;
  return (
    <span class="store-badge" title={store.name}>
      <i style={{ backgroundColor: store.color, maskImage: `url(/icons/containers/${store.icon}.svg)`, WebkitMaskImage: `url(/icons/containers/${store.icon}.svg)` }} />
      {label && <span>{store.name}</span>}
    </span>
  );
}

/** Does the extension have access to all sites? Needed to read cookies. */
export function useHostAccess(): [boolean | undefined, () => Promise<void>] {
  const [granted, setGranted] = useState<boolean | undefined>(undefined);
  const check = () => ext.permissions.contains({ origins: ["<all_urls>"] }).then(setGranted, () => setGranted(true));
  useEffect(() => {
    void check();
  }, []);
  const request = async () => {
    try {
      await ext.permissions.request({ origins: ["<all_urls>"] });
    } finally {
      await check();
    }
  };
  return [granted, request];
}

export function AccessBanner({ onGrant }: { onGrant: () => void }) {
  return (
    <div class="banner warn" role="alert">
      <span>{t("accessNeeded")}</span>
      <button onClick={onGrant}>{t("accessGrant")}</button>
    </div>
  );
}

export function SupportSection() {
  const [copied, setCopied] = useState("");
  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      /* the address is selectable anyway */
    }
  };
  return (
    <section class="card dashed" id="support">
      <h2>{t("supportTitle")}</h2>
      <p>{t("supportText")}</p>
      <p><a class="button" href={BOOSTY_URL} target="_blank" rel="noopener">{t("supportBoosty")}</a></p>
      {WALLETS.map(w => (
        <div class="wallet">
          <div><strong>{w.network}</strong> <span class="muted">{w.coins}</span></div>
          <code>{w.address}</code>
          <button class="secondary" onClick={() => copy(w.address)}>{copied === w.address ? t("copied") : t("copy")}</button>
        </div>
      ))}
      <p class="muted small">{t("supportNetworkNote")}</p>
    </section>
  );
}

export function Footer() {
  return (
    <footer>
      {t("basedOn")} <a href={ORIGINAL_URL} target="_blank" rel="noopener">Cookie Quick Manager</a> {t("byAuthor")} · {" "}
      <a href={REPO_URL} target="_blank" rel="noopener">GitHub</a> · {" "}
      <a href={`${REPO_URL}/blob/main/PRIVACY.md`} target="_blank" rel="noopener">{t("privacy")}</a> · GPL-3.0
    </footer>
  );
}

/** Downloads text as a file from an extension page. */
export function downloadText(filename: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: type + ";charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** Reads a file chosen by the user as text. */
export function pickTextFile(accept: string): Promise<string | null> {
  return new Promise(resolve => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      file.text().then(resolve, () => resolve(null));
    };
    input.click();
  });
}
