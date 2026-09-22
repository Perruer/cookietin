/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext } from "./api";
import { getSettings } from "./settings";

export interface ManagerTarget {
  /** Pre-filled search (usually the site of the current tab). */
  search?: string;
  /** Cookie store to show; empty = all. */
  store?: string;
}

export function managerUrl(target: ManagerTarget = {}): string {
  const params = new URLSearchParams();
  if (target.search) params.set("q", target.search);
  if (target.store) params.set("store", target.store);
  const qs = params.toString();
  return ext.runtime.getURL("manager/manager.html") + (qs ? "?" + qs : "");
}

/** Opens the cookie manager in a tab or in its own window (setting). */
export async function openManager(target: ManagerTarget = {}): Promise<void> {
  const s = await getSettings();
  const url = managerUrl(target);
  let android = false;
  try {
    android = (await ext.runtime.getPlatformInfo()).os === "android";
  } catch {
    /* ignore */
  }
  if (s.openIn === "window" && !android && ext.windows?.create) {
    await ext.windows.create({
      url,
      type: "popup",
      width: Math.max(760, s.windowWidth),
      height: Math.max(480, s.windowHeight)
    });
  } else {
    await ext.tabs.create({ url });
  }
}
