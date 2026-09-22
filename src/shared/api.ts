/*
 * CookieTin — cookie manager for Firefox and Chromium.
 * Copyright (C) 2026 Perruer. Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * WebExtension API: `browser` in Firefox, `chrome` in Chromium. Both return
 * promises in Manifest V3, so the chrome typings are used for both.
 */
export const ext: typeof chrome = (globalThis as any).browser ?? (globalThis as any).chrome;

export const isFirefox = typeof ext?.runtime?.getURL === "function" &&
  ext.runtime.getURL("").startsWith("moz-extension:");

/** Localized UI string; falls back to the key so missing strings are visible. */
export function t(key: string, substitutions?: string | number | (string | number)[]): string {
  const subs = substitutions === undefined ? undefined
    : Array.isArray(substitutions) ? substitutions.map(String) : String(substitutions);
  try {
    return ext.i18n.getMessage(key, subs) || key;
  } catch {
    return key;
  }
}

/** Language of the browser UI, e.g. "ru", "en", "de". */
export function uiLanguage(): string {
  try {
    return ext.i18n.getUILanguage();
  } catch {
    return (globalThis.navigator && navigator.language) || "en";
  }
}
