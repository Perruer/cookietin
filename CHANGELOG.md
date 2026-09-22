# Changelog

## 1.0.0 — CookieTin

First release of CookieTin, a rewrite of Cookie Quick Manager 0.5rc2 for Manifest V3.

**Fixed**
- The toolbar menu works in current Firefox (its buttons stopped responding in Firefox 156).
- Partitioned cookies (Total Cookie Protection, CHIPS) are listed, edited and deleted. Before,
  some cookies could not be deleted and editing them created duplicates.
- cookies.txt export uses the real Netscape layout (include-subdomains column, `TRUE`/`FALSE`,
  `#HttpOnly_` prefix), so curl, wget and yt-dlp read it.

**New**
- Chromium (Chrome, Edge, Brave, …) and Firefox (desktop and Android) builds from one TypeScript
  code base.
- Toolbar menu: site cookies including subdomains and partitioned cookies of embedded sites,
  delete with Undo, clear localStorage/sessionStorage/IndexedDB/cache of the site, delete all
  cookies of the window or container with a second click to confirm (can be hidden).
- Manager: search with `name:` and `value:`, multiple selection (Ctrl/Shift, checkboxes, select
  all), bulk delete / protect / unprotect / export / copy to container, Undo, filters (session,
  protected, partitioned, HttpOnly, not Secure), live updates, keyboard shortcuts.
- Editor: all attributes including partition and First-Party domain, URL and Base64 tools, JWT
  decoding, byte size, relative expiry, checks for values the browser would reject, Duplicate.
  Renaming or moving a cookie replaces it (the old one is removed; protection moves along).
- Import and export: JSON compatible with Cookie-Editor / EditThisCookie, cookies.txt, Cookie
  header, Cookie Quick Manager JSON; import from Playwright / Puppeteer storage state; choose the
  container and protect imported cookies.
- Periodic cleanup every 1–24 hours that keeps protected cookies and sites open in tabs.
- Restore settings and protected cookies from a Cookie Quick Manager backup.
- Dark theme; English, Russian, German and French interface.

**Removed**
- The First-Party Isolation on/off switch and the `privacy` permission (Firefox replaced FPI with
  state partitioning; FPI cookies are still supported).
- The "skin" option, jQuery, Bootstrap 3 and the other bundled libraries.

---

## Cookie Quick Manager history (by Ysard)

See the original repository: https://github.com/ysard/cookie-quick-manager
