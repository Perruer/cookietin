# Firefox Add-ons (addons.mozilla.org) — listing for CookieTin 1.0.0

Upload: `dist/cookietin-firefox-1.0.0.zip`
Distribution: **On this site** (listed)

---

## 1. Upload step

| Question | Answer |
|---|---|
| Compatible platforms | **Firefox** and **Firefox for Android** (both ticked) |
| Do you need to submit source code? | **Yes.** The code is TypeScript bundled with esbuild (not minified). Upload `dist/cookietin-source-1.0.0.zip`; it contains `BUILD.md` with the build steps (`npm ci && npm run build`). The build is reproducible: the output is byte-identical to the uploaded package. |

Data collection (declared in the manifest): **none**. CookieTin sends nothing anywhere.

## 2. Describe add-on — English (default locale)

**Name:** comes from the manifest: *CookieTin — Cookie Manager & Editor*

**Add-on URL (slug):** `cookietin`

**Summary** (max 250 characters; 219 used):

> A cookie manager that sees every cookie, including partitioned ones and containers. View, edit, protect, import and export cookies; delete a site's cookies with Undo; clean up on a schedule. No data leaves your browser.

**Description:**

```
CookieTin shows every cookie your browser keeps and lets you change it: in normal and private windows, in Multi-Account Containers, and the partitioned cookies that Total Cookie Protection keeps for embedded sites — the ones many cookie managers can't see or delete.

TOOLBAR MENU FOR THE CURRENT SITE
• Open the site's cookies in the manager
• Delete them, including subdomains and the cookies of embedded sites — with Undo
• Clear the site's localStorage, sessionStorage, IndexedDB and cache
• Delete all cookies of the window or container (asks twice; can be hidden)

MANAGER
• Domains, cookies and an editor side by side
• Search: github name:session value:abc
• Select several cookies (Ctrl/Shift or checkboxes) and delete, protect, export or copy them to another container at once
• Filters: session, protected, partitioned, HttpOnly, not Secure
• Live updates, keyboard shortcuts, dark theme

EDITOR
Every attribute: name, value, domain and subdomains, path, expiry or session, Secure, HttpOnly, SameSite, container, partition, first-party domain. URL and Base64 decode/encode, JSON Web Token decoding, byte size, and a warning when the browser would reject the cookie.

PROTECTED COOKIES
Lock the cookies that keep you logged in. CookieTin never deletes them and can restore them when a site or the browser removes them.

AUTOMATIC CLEANUP
Delete unprotected cookies when Firefox starts and/or every 1–24 hours, keeping the sites open in your tabs.

IMPORT & EXPORT
JSON (compatible with Cookie-Editor and EditThisCookie), cookies.txt for curl, wget and yt-dlp, a Cookie header line, Cookie Quick Manager JSON; import from Playwright/Puppeteer too.

COMING FROM COOKIE QUICK MANAGER?
CookieTin is a maintained rewrite of it. In Cookie Quick Manager's settings click "Backup user data", then "Restore from file…" in CookieTin: your protected cookies and settings come along.

PRIVACY
No accounts, no analytics, no network requests. Everything stays in your browser.

English, Russian, German and French interface. Works on Firefox for Android too.

CookieTin is free and open source (GPL-3.0), based on Cookie Quick Manager by Ysard.
Source code and bug reports: https://github.com/Perruer/cookietin
```

**Categories:** Privacy & Security; Web Development
(Android: Privacy & Security)

**Tags:** pick from AMO's drop-down, for example **cookies**, **privacy**, **developer tools**, **container**.

**Homepage:** https://github.com/Perruer/cookietin
**Support website:** https://github.com/Perruer/cookietin/issues
**Support email:** optional
**License:** GNU General Public License v3.0 (choose "GNU General Public License v3.0"; the code is GPL-3.0-or-later)
**Privacy policy:** Yes — paste the text of [PRIVACY.md](../PRIVACY.md) (AMO wants the text, not a link).
**Contributions URL:** AMO only accepts PayPal, Patreon, Liberapay, Ko-fi, GitHub Sponsors, Open Collective
or Buy Me a Coffee. Boosty isn't allowed, so leave it empty unless one of those accounts exists.

## 3. Russian (Русский) localization

**Название** берётся из манифеста: *CookieTin — менеджер и редактор cookie*

**Краткое описание** (до 250 символов; 206 занято):

> Менеджер cookie, который видит все cookie, включая изолированные и контейнеры. Просмотр, правка, защита, импорт и экспорт; удаление cookie сайта с отменой; очистка по расписанию. Данные не покидают браузер.

**Описание:**

```
CookieTin показывает все cookie, которые хранит браузер, и позволяет их менять: в обычных и приватных окнах, в контейнерах Firefox и изолированные cookie, которые Total Cookie Protection хранит для встроенных сайтов, — те самые, которые многие менеджеры не видят и не могут удалить.

МЕНЮ КНОПКИ ДЛЯ ТЕКУЩЕГО САЙТА
• Открыть cookie сайта в менеджере
• Удалить их вместе с поддоменами и cookie встроенных сайтов — с кнопкой «Отменить»
• Очистить localStorage, sessionStorage, IndexedDB и кэш сайта
• Удалить все cookie окна или контейнера (со вторым нажатием; пункт можно скрыть)

МЕНЕДЖЕР
• Домены, cookie и редактор рядом
• Поиск: github name:session value:abc
• Выбор нескольких cookie (Ctrl/Shift или галочки) и действия сразу над всеми: удалить, защитить, экспортировать, скопировать в другой контейнер
• Фильтры: сеансовые, защищённые, изолированные, HttpOnly, без Secure
• Обновление на лету, горячие клавиши, тёмная тема

РЕДАКТОР
Все атрибуты: имя, значение, домен и поддомены, путь, срок или сеанс, Secure, HttpOnly, SameSite, контейнер, изоляция, первичный домен. Раскодирование URL и Base64, расшифровка JSON Web Token, размер в байтах и предупреждение, если браузер не примет cookie.

ЗАЩИЩЁННЫЕ COOKIE
Закрепите cookie, на которых держатся входы в аккаунты: CookieTin их не удаляет и может вернуть, если их сотрёт сайт или браузер.

АВТООЧИСТКА
Удаление незащищённых cookie при запуске Firefox и/или каждые 1–24 часа, не трогая сайты, открытые во вкладках.

ИМПОРТ И ЭКСПОРТ
JSON (совместим с Cookie-Editor и EditThisCookie), cookies.txt для curl, wget и yt-dlp, строка заголовка Cookie, JSON Cookie Quick Manager; импорт и из Playwright/Puppeteer.

ПЕРЕХОДИТЕ С COOKIE QUICK MANAGER?
CookieTin — его поддерживаемая переработка. В настройках Cookie Quick Manager нажмите «Backup user data», затем в CookieTin — «Восстановить из файла…»: защищённые cookie и настройки перенесутся.

ПРИВАТНОСТЬ
Без аккаунтов, аналитики и сетевых запросов. Всё остаётся в браузере.

Интерфейс на русском, английском, немецком и французском. Работает и в Firefox для Android.

CookieTin — бесплатный открытый проект (GPL-3.0) на основе Cookie Quick Manager от Ysard.
Исходный код и сообщения об ошибках: https://github.com/Perruer/cookietin
```

## 4. Screenshots

English listing: `docs/screenshots/en/`, Russian listing: `docs/screenshots/ru/` (1280×800).

| File | Caption EN | Подпись RU |
|---|---|---|
| `01-manager.png` | Domains, cookies and the editor side by side; protected cookies are locked | Домены, cookie и редактор рядом; защищённые cookie отмечены замком |
| `02-editor-jwt.png` | Every attribute, value tools and JSON Web Token decoding | Все атрибуты, инструменты для значения и расшифровка JWT |
| `03-popup.png` | Toolbar menu: the current site's cookies and data, with Undo | Меню кнопки: cookie и данные текущего сайта, с отменой |
| `04-export.png` | Export to JSON, cookies.txt (curl, yt-dlp) or a Cookie header | Экспорт в JSON, cookies.txt (curl, yt-dlp) или заголовок Cookie |
| `05-settings.png` | Automatic cleanup and protected cookies | Автоочистка и защищённые cookie |
| `06-dark-partitioned.png` | Partitioned cookies of embedded sites, bulk actions, dark theme | Изолированные cookie встроенных сайтов, массовые действия, тёмная тема |

## 5. Notes to reviewer

```
CookieTin 1.0.0 is a Manifest V3 rewrite of "Cookie Quick Manager" (GPL-3.0, unmaintained since 2019; its popup stopped working in Firefox 156) under a new name and add-on ID.

SOURCE: TypeScript + Preact, bundled per entry point with esbuild, NOT minified. Source zip attached; BUILD.md explains the build (npm ci && npm run build → dist/firefox). The build is reproducible (byte-identical to the uploaded package). Third-party code in the bundles: Preact 10 (MIT). The 3 UNSAFE_VAR_ASSIGNMENT (innerHTML) lint warnings come from Preact's dangerouslySetInnerHTML support, which CookieTin never uses. The container icons are Mozilla's (MPL-2.0).

NO NETWORK, NO REMOTE CODE. The extension makes no network requests, has no eval and loads no remote scripts. Data collection: none.

PERMISSIONS
- cookies + <all_urls> host permission: list, edit and delete the cookies of any site (the core function).
- storage: settings and the list of protected cookies (domain + name).
- alarms: optional periodic cleanup (off by default).
- scripting: only on the active tab, when the user opens the toolbar menu (count localStorage/sessionStorage items) or clicks "Clear site data" (clear localStorage, sessionStorage, IndexedDB, Cache Storage).
- browsingData: "Clear site data" for the site's other origins (hostnames filter).
- contextualIdentities: list containers to show and filter their cookies.

HOW TO TEST (no account needed)
1. Open any site, e.g. https://www.wikipedia.org, then click the CookieTin toolbar button: the menu shows the site and its cookie count.
2. "Cookies of wikipedia.org" opens the manager. Click a cookie, change its value, click Save.
3. Click Protect, then in the toolbar menu "Delete cookies of wikipedia.org": the protected cookie stays; the others can be restored with Undo.
4. Export (top bar) → cookies.txt; Import accepts the same text back.
5. Partitioned cookies: open a page that embeds a third-party frame (e.g. a YouTube embed); the frame's cookies appear under their own domain with a "stored for <site>" tag and can be deleted.
```

## 6. After approval

- Check the listing URL and update README (`https://addons.mozilla.org/firefox/addon/cookietin-cookie-manager/`).
- Attach the AMO-signed `.xpi` to the GitHub Release.
