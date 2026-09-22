/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext } from "./api";
import { getProtected, saveProtected, withProtection, type ProtectedMap } from "./protect";
import { DEFAULT_SETTINGS, saveSettings, type Settings } from "./settings";

/** Storage keys of Cookie Quick Manager 0.5 (besides protected_cookies, which CookieTin shares). */
export const LEGACY_KEYS = [
  "delete_all_on_restart", "prevent_protected_cookies_deletion", "open_in_new_tab", "display_deletion_alert",
  "template", "skin", "addonSize", "auto_actualize_checkbox", "import_protected_cookies"
];

/** Marker left after an upgrade from Cookie Quick Manager (shown once in the settings). */
export const MIGRATED_KEY = "migratedFromCqm";

/** CookieTin settings from Cookie Quick Manager's keys. */
export function legacySettings(data: Record<string, unknown>): Partial<Settings> {
  const patch: Partial<Settings> = {};
  if (typeof data.delete_all_on_restart === "boolean") patch.deleteOnStartup = data.delete_all_on_restart;
  if (typeof data.prevent_protected_cookies_deletion === "boolean") patch.guardProtected = data.prevent_protected_cookies_deletion;
  if (typeof data.open_in_new_tab === "boolean") patch.openIn = data.open_in_new_tab ? "tab" : "window";
  if (typeof data.display_deletion_alert === "boolean") patch.confirmBulk = data.display_deletion_alert;
  if (typeof data.auto_actualize_checkbox === "boolean") patch.autoRefresh = data.auto_actualize_checkbox;
  if (data.template === "NETSCAPE") patch.exportFormat = "netscape";
  else if (data.template === "JSON") patch.exportFormat = "json";
  const size = data.addonSize as { width?: unknown; height?: unknown } | undefined;
  if (size && typeof size.width === "number" && typeof size.height === "number") {
    patch.windowWidth = size.width;
    patch.windowHeight = size.height;
  }
  return patch;
}

/** Keeps only known settings with the right types. */
function cleanSettings(patch: Partial<Settings>): Partial<Settings> {
  const clean: Partial<Settings> = {};
  for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
    if (k in patch && typeof patch[k] === typeof DEFAULT_SETTINGS[k]) (clean as any)[k] = patch[k];
  }
  return clean;
}

function protectedList(map: unknown): { domain: string; name: string }[] {
  if (!map || typeof map !== "object" || Array.isArray(map)) return [];
  return Object.entries(map as ProtectedMap).flatMap(([domain, names]) =>
    (Array.isArray(names) ? names : []).map(name => ({ domain, name: String(name) })));
}

/**
 * Restores a CookieTin backup or a Cookie Quick Manager "Backup user data"
 * file. Returns the number of protected cookies found.
 */
export async function restoreBackup(text: string): Promise<number> {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("not an object");
  const patch = data.app === "CookieTin" ? (data.settings || {}) : legacySettings(data);
  const clean = cleanSettings(patch);
  if (Object.keys(clean).length) await saveSettings(clean);
  if (data.protected_cookies !== undefined) {
    // Merge with what is already protected here.
    const cookies = protectedList(data.protected_cookies);
    await saveProtected(withProtection(await getProtected(), cookies, true));
    return cookies.length;
  }
  return 0;
}

/**
 * Upgrade in place from Cookie Quick Manager (same add-on ID): its storage
 * is still there. protected_cookies has the same layout and is kept as is;
 * the other keys become CookieTin settings. Returns true if it migrated.
 */
export async function migrateLegacyStorage(): Promise<boolean> {
  const all = (await ext.storage.local.get(null)) as Record<string, unknown>;
  if (all.settings) return false;
  const legacy = LEGACY_KEYS.filter(k => k in all);
  if (!legacy.length && !("protected_cookies" in all)) return false;
  await saveSettings(cleanSettings(legacySettings(all)));
  // An old Cookie Quick Manager bug stored an array here.
  if (Array.isArray(all.protected_cookies)) await saveProtected({});
  if (legacy.length) await ext.storage.local.remove(legacy);
  await ext.storage.local.set({ [MIGRATED_KEY]: protectedList(all.protected_cookies).length });
  return true;
}
