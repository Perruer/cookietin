/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext } from "./api";

export type ExportFormat = "json" | "netscape" | "cqm" | "header";

export interface Settings {
  /** Delete all cookies except protected ones when the browser starts. */
  deleteOnStartup: boolean;
  /** Put protected cookies back when a site or the browser deletes them. */
  guardProtected: boolean;
  /** Periodic cleanup interval in hours; 0 = off. */
  cleanupHours: number;
  /** Periodic cleanup keeps the cookies of sites open in tabs. */
  cleanupKeepOpenTabs: boolean;
  /** Where the manager opens. */
  openIn: "tab" | "window";
  /** Ask before deleting more than one cookie. */
  confirmBulk: boolean;
  /** Show "Delete all cookies in this container" in the popup. */
  showStoreDelete: boolean;
  exportFormat: ExportFormat;
  theme: "auto" | "light" | "dark";
  /** Manager: selecting a domain also shows its subdomains. */
  includeSubdomains: boolean;
  /** Manager: refresh the lists when cookies change. */
  autoRefresh: boolean;
  /** Size of the manager window. */
  windowWidth: number;
  windowHeight: number;
}

export const DEFAULT_SETTINGS: Settings = {
  deleteOnStartup: false,
  guardProtected: true,
  cleanupHours: 0,
  cleanupKeepOpenTabs: true,
  openIn: "tab",
  confirmBulk: true,
  showStoreDelete: true,
  exportFormat: "json",
  theme: "auto",
  includeSubdomains: true,
  autoRefresh: true,
  windowWidth: 1200,
  windowHeight: 760
};

const KEY = "settings";

export async function getSettings(): Promise<Settings> {
  const got = await ext.storage.local.get(KEY);
  return { ...DEFAULT_SETTINGS, ...((got[KEY] as Partial<Settings>) || {}) };
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await ext.storage.local.set({ [KEY]: next });
  return next;
}

export function onSettingsChanged(cb: (s: Settings) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === "local" && changes[KEY]) cb({ ...DEFAULT_SETTINGS, ...(changes[KEY].newValue as Partial<Settings> || {}) });
  };
  ext.storage.onChanged.addListener(listener);
  return () => ext.storage.onChanged.removeListener(listener);
}
