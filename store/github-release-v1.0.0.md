<!--
GitHub Release
  Tag:    v1.0.0
  Title:  CookieTin 1.0.0 — every cookie, in one tin
  Assets: dist/cookietin-chrome-1.0.0.zip
          (after AMO signs it: the signed .xpi)
Body below the line.
-->

**CookieTin** is a cookie manager and editor for Firefox, Edge and Chrome that sees every cookie: containers, private windows and the partitioned cookies that many managers can't see or delete. This is the first release: a Manifest V3 rewrite of [Cookie Quick Manager](https://github.com/ysard/cookie-quick-manager) by Ysard, whose toolbar menu stopped working in Firefox 156.

![CookieTin demo](https://raw.githubusercontent.com/Perruer/cookietin/main/docs/demo.gif)

## Install

- **Firefox** (desktop and Android): [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/cookietin/)
- **Microsoft Edge:** Edge Add-ons (link will be added after the listing is approved)
- **Chrome, Brave, Vivaldi, Opera:** download **`cookietin-chrome-1.0.0.zip`** below, then:
  1. Unzip it into a folder you will keep.
  2. Open `chrome://extensions` and turn on **Developer mode** (top-right).
  3. Click **Load unpacked** and pick the unzipped folder (the one with `manifest.json`).
  4. Pin CookieTin from the puzzle 🧩 menu.

  To update later: replace the files in the same folder and press ↻ on the CookieTin card. Your settings are kept.

## Highlights

- **Partitioned cookies** (Total Cookie Protection, CHIPS) are listed, edited and deleted
- Toolbar menu for the current site: its cookies, delete with **Undo**, clear localStorage / sessionStorage / IndexedDB / cache
- Manager with search (`github name:session value:abc`), multiple selection and bulk delete / protect / export / copy to container
- Editor with every attribute, URL/Base64 tools, JWT decoding and checks before the browser rejects a cookie
- **Protected cookies** and automatic cleanup on startup or every 1–24 hours
- Import/export: JSON (Cookie-Editor, EditThisCookie), cookies.txt (curl, yt-dlp), Cookie header, Cookie Quick Manager JSON, Playwright
- Moving from Cookie Quick Manager: restore its "Backup user data" file in CookieTin's settings
- No network requests, no analytics; English, Russian, German and French; dark theme

Full list: [CHANGELOG.md](https://github.com/Perruer/cookietin/blob/main/CHANGELOG.md)

## Support the project

CookieTin is free and has no ads. If it saves you time, you can support it on **[Boosty](https://boosty.to/mikio_kuroki/donate)** or with crypto (TRON, Ethereum/EVM, TON). The addresses are in the [README](https://github.com/Perruer/cookietin#support-the-project).
