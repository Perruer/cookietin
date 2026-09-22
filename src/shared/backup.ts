/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { getProtected, saveProtected, withProtection, type ProtectedMap } from "./protect";
import { DEFAULT_SETTINGS, saveSettings, type Settings } from "./settings";

/**
 * Restores a CookieTin backup or a Cookie Quick Manager "Backup user data"
 * file. Returns the number of protected cookies found.
 */
export async function restoreBackup(text: string): Promise<number> {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("not an object");
  const patch: Partial<Settings> = {};
  let map: ProtectedMap | undefined;
  if (data.app === "CookieTin") {
    Object.assign(patch, data.settings || {});
    map = data.protected_cookies;
  } else {
    // Cookie Quick Manager keys
    if (typeof data.delete_all_on_restart === "boolean") patch.deleteOnStartup = data.delete_all_on_restart;
    if (typeof data.prevent_protected_cookies_deletion === "boolean") patch.guardProtected = data.prevent_protected_cookies_deletion;
    if (typeof data.open_in_new_tab === "boolean") patch.openIn = data.open_in_new_tab ? "tab" : "window";
    if (typeof data.display_deletion_alert === "boolean") patch.confirmBulk = data.display_deletion_alert;
    if (data.template === "NETSCAPE") patch.exportFormat = "netscape";
    else if (data.template === "JSON") patch.exportFormat = "json";
    map = data.protected_cookies;
  }
  if (map !== undefined && (typeof map !== "object" || Array.isArray(map))) map = {};
  const known = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];
  const clean: Partial<Settings> = {};
  for (const k of known) if (k in patch && typeof patch[k] === typeof DEFAULT_SETTINGS[k]) (clean as any)[k] = patch[k];
  if (Object.keys(clean).length) await saveSettings(clean);
  if (map) {
    // Merge with what is already protected here.
    const current = await getProtected();
    const cookies = Object.entries(map).flatMap(([domain, names]) => (Array.isArray(names) ? names : []).map(name => ({ domain, name: String(name) })));
    await saveProtected(withProtection(current, cookies, true));
    return cookies.length;
  }
  return 0;
}
