/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { ext } from "../shared/api";
import { migrateLegacyStorage } from "../shared/backup";
import { cleanAll } from "../shared/cleanup";
import { setCookie, type Cookie } from "../shared/cookies";
import { getProtected, isProtected } from "../shared/protect";
import { getSettings, onSettingsChanged, type Settings } from "../shared/settings";

const CLEANUP_ALARM = "cookietin-cleanup";

async function scheduleCleanup(s: Settings) {
  await ext.alarms.clear(CLEANUP_ALARM);
  if (s.cleanupHours > 0) {
    const minutes = Math.max(15, Math.round(s.cleanupHours * 60));
    await ext.alarms.create(CLEANUP_ALARM, { delayInMinutes: minutes, periodInMinutes: minutes });
  }
}

ext.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name !== CLEANUP_ALARM) return;
  const s = await getSettings();
  if (s.cleanupHours > 0) await cleanAll(s.cleanupKeepOpenTabs);
});

onSettingsChanged(s => void scheduleCleanup(s));

ext.runtime.onInstalled.addListener(async details => {
  // Updated in place from Cookie Quick Manager (Firefox build with its ID):
  // convert its settings and tell the user what happened.
  if (details.reason === "update" && (await migrateLegacyStorage())) {
    await ext.tabs.create({ url: ext.runtime.getURL("options/options.html#welcome") });
  }
  await scheduleCleanup(await getSettings());
});

ext.runtime.onStartup.addListener(async () => {
  const s = await getSettings();
  await scheduleCleanup(s);
  if (s.deleteOnStartup) {
    // Right after startup the cookie store may not be loaded yet
    // (Cookie Quick Manager saw 0 cookies without this delay).
    setTimeout(() => void cleanAll(false), 2000);
  }
});

/**
 * Protected cookies: when a site or the browser deletes one, put it back.
 * Only explicit deletions count; expiry and overwrites are left alone.
 */
ext.cookies.onChanged.addListener(async info => {
  if (!info.removed || info.cause !== "explicit") return;
  const cookie = info.cookie as Cookie;
  const [settings, map] = await Promise.all([getSettings(), getProtected()]);
  if (!settings.guardProtected || !isProtected(map, cookie)) return;
  try {
    await setCookie(cookie);
  } catch {
    /* e.g. the store of a closed private window */
  }
});

