# Shipping CookieTin as an update of the Cookie Quick Manager listing

Only if Ysard adds Perruer as an author of https://addons.mozilla.org/firefox/addon/cookie-quick-manager/
(AMO → the add-on → *Manage Authors & License*). Then the update reaches its ~45,000 users
automatically: Firefox updates add-ons by ID, and this build carries Cookie Quick Manager's ID
`{60f82f00-9ad5-4de5-b31c-b16a47c51558}`.

## Build

```bash
npm ci
npm run package:cqm        # dist-cqm/cookietin-as-cqm-firefox-<version>.zip
npm run package            # dist/cookietin-source-<version>.zip (same source)
node test/e2e/upgrade.mjs  # installs Cookie Quick Manager 0.5rc2, updates it, checks the migration
```

The code is the same as the regular build; only the add-on ID in the manifest differs
(`scripts/build.mjs --cqm`).

## What happens for the users

- Firefox installs 1.0.0 over 0.5rc2 (a higher version). No new permission prompt is expected:
  `alarms` and `scripting` have no install warning, and access to all sites was already granted.
  `privacy` and `activeTab` are no longer requested.
- On the update CookieTin converts Cookie Quick Manager's settings (cleanup on startup, website
  protection, tab/window, deletion prompt, export format, auto-refresh, window size). The list of
  protected cookies has the same key and layout and stays as is.
- A settings tab opens once: "Cookie Quick Manager is now CookieTin", with the number of protected
  cookies kept and what's new.

## Upload to the Cookie Quick Manager listing

1. *Upload a new version* → `dist-cqm/cookietin-as-cqm-firefox-1.0.0.zip`; platforms Firefox and
   Firefox for Android; source code: `dist/cookietin-source-1.0.0.zip`, and say in the notes that
   the package is built with `node scripts/build.mjs --cqm`.
2. *Edit listing*: name "CookieTin (formerly Cookie Quick Manager)", summary and description from
   [amo.md](amo.md), new screenshots, homepage and support links to github.com/Perruer/cookietin,
   license stays GPL-3.0.
3. Version notes:

   ```
   Cookie Quick Manager is now CookieTin: a Manifest V3 rewrite that works in current Firefox again (the toolbar menu stopped responding in Firefox 156). Your settings and protected cookies are kept.
   New: partitioned cookies can be listed and deleted, correct cookies.txt for yt-dlp and curl, multiple selection and bulk actions, Undo, JWT/Base64 tools, periodic cleanup, dark theme, German/French/Russian/English.
   ```

4. Notes to reviewer: the same as in [amo.md](amo.md#5-notes-to-reviewer), plus:

   ```
   This version is a handover: the original author (Ysard) added me as an author of this listing. The code is the CookieTin project (https://github.com/Perruer/cookietin), built with `node scripts/build.mjs --cqm`, which only sets this listing's add-on ID in the manifest. On update it converts the old storage keys (see src/shared/backup.ts, migrateLegacyStorage).
   ```

5. The separate CookieTin listing: either don't submit it, or keep it and point its description to
   this one. One listing is better: users and reviews stay in one place.
