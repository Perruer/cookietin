# Microsoft Edge Add-ons (Partner Center) — listing for CookieTin 1.0.0

Upload: `dist/cookietin-chrome-1.0.0.zip` (the Chromium build is used for Edge)

---

## 1. Availability

- Visibility: **Public**
- Markets: **all markets**

## 2. Properties

| Field | Value |
|---|---|
| Category | **Developer tools** (alternative: Privacy & security) |
| Does the extension access, collect or transmit personal information? | **Yes, it accesses** cookies (which can include authentication data) to show and edit them. **Nothing is collected or transmitted:** the extension makes no network requests. |
| Privacy policy URL | https://github.com/Perruer/cookietin/blob/main/PRIVACY.md |
| Website URL | https://github.com/Perruer/cookietin |
| Support contact | https://github.com/Perruer/cookietin/issues |
| Mature content | No |

## 3. Store listing — English (en-US)

**Description** (Edge: 250–10,000 characters):

```
CookieTin shows every cookie your browser keeps and lets you change it: in normal and InPrivate windows, and the partitioned cookies (CHIPS) that sites store while embedded in other sites — the ones many cookie managers can't see or delete.

TOOLBAR MENU FOR THE CURRENT SITE
• Open the site's cookies in the manager
• Delete them, including subdomains and the cookies of embedded sites — with Undo
• Clear the site's localStorage, sessionStorage, IndexedDB and cache
• Delete all cookies (asks twice; can be hidden)

MANAGER
• Domains, cookies and an editor side by side
• Search: github name:session value:abc
• Select several cookies (Ctrl/Shift or checkboxes) and delete, protect, export or copy them at once
• Filters: session, protected, partitioned, HttpOnly, not Secure
• Live updates, keyboard shortcuts, dark theme

EDITOR
Every attribute: name, value, domain and subdomains, path, expiry or session, Secure, HttpOnly, SameSite, partition. URL and Base64 decode/encode, JSON Web Token decoding, byte size, and a warning when the browser would reject the cookie.

PROTECTED COOKIES
Lock the cookies that keep you logged in. CookieTin never deletes them and can restore them when a site or the browser removes them.

AUTOMATIC CLEANUP
Delete unprotected cookies when Edge starts and/or every 1–24 hours, keeping the sites open in your tabs.

IMPORT & EXPORT
JSON (compatible with Cookie-Editor and EditThisCookie), cookies.txt for curl, wget and yt-dlp, a Cookie header line, Cookie Quick Manager JSON; import from Playwright/Puppeteer too.

PRIVACY
No accounts, no analytics, no network requests. Everything stays in your browser.

English, Russian, German and French interface.

CookieTin is free and open source (GPL-3.0), based on Cookie Quick Manager by Ysard.
Source code and bug reports: https://github.com/Perruer/cookietin
```

**Short description:** from the manifest (129 characters):
> View, edit, protect, import and export cookies. Containers, private windows and partitioned cookies. Nothing leaves your browser.

**Search terms** (max 7 terms × 30 characters, 21 words in total — 13 used):

1. `cookie manager`
2. `cookie editor`
3. `edit cookies`
4. `export cookies`
5. `cookies.txt`
6. `delete cookies`
7. `developer tools`

## 4. Store listing — Russian (ru)

**Описание:**

```
CookieTin показывает все cookie, которые хранит браузер, и позволяет их менять: в обычных окнах и окнах InPrivate, а также изолированные cookie (CHIPS), которые сайты сохраняют, будучи встроенными в другие сайты, — те самые, которые многие менеджеры не видят и не могут удалить.

МЕНЮ КНОПКИ ДЛЯ ТЕКУЩЕГО САЙТА
• Открыть cookie сайта в менеджере
• Удалить их вместе с поддоменами и cookie встроенных сайтов — с кнопкой «Отменить»
• Очистить localStorage, sessionStorage, IndexedDB и кэш сайта
• Удалить все cookie (со вторым нажатием; пункт можно скрыть)

МЕНЕДЖЕР
• Домены, cookie и редактор рядом
• Поиск: github name:session value:abc
• Выбор нескольких cookie (Ctrl/Shift или галочки) и действия сразу над всеми: удалить, защитить, экспортировать, скопировать
• Фильтры: сеансовые, защищённые, изолированные, HttpOnly, без Secure
• Обновление на лету, горячие клавиши, тёмная тема

РЕДАКТОР
Все атрибуты: имя, значение, домен и поддомены, путь, срок или сеанс, Secure, HttpOnly, SameSite, изоляция. Раскодирование URL и Base64, расшифровка JSON Web Token, размер в байтах и предупреждение, если браузер не примет cookie.

ЗАЩИЩЁННЫЕ COOKIE
Закрепите cookie, на которых держатся входы в аккаунты: CookieTin их не удаляет и может вернуть, если их сотрёт сайт или браузер.

АВТООЧИСТКА
Удаление незащищённых cookie при запуске Edge и/или каждые 1–24 часа, не трогая сайты, открытые во вкладках.

ИМПОРТ И ЭКСПОРТ
JSON (совместим с Cookie-Editor и EditThisCookie), cookies.txt для curl, wget и yt-dlp, строка заголовка Cookie, JSON Cookie Quick Manager; импорт и из Playwright/Puppeteer.

ПРИВАТНОСТЬ
Без аккаунтов, аналитики и сетевых запросов. Всё остаётся в браузере.

Интерфейс на русском, английском, немецком и французском.

CookieTin — бесплатный открытый проект (GPL-3.0) на основе Cookie Quick Manager от Ysard.
Исходный код и сообщения об ошибках: https://github.com/Perruer/cookietin
```

**Краткое описание:** из манифеста (128 символов):
> Просмотр, правка, защита, импорт и экспорт cookie. Контейнеры, приватные окна, изолированные cookie. Данные не покидают браузер.

**Поисковые запросы** (до 7):

1. `менеджер cookie`
2. `редактор cookie`
3. `удалить cookie`
4. `экспорт cookie`
5. `cookies.txt`
6. `куки`
7. `инструменты разработчика`

## 5. Images

| Asset | Required | File |
|---|---|---|
| Store logo 300×300 | yes | `store/logo-300.png` |
| Small promotional tile 440×280 | optional | `store/promo-small-440x280.png` |
| Large promotional tile 1400×560 | optional (needed for featuring) | `store/promo-large-1400x560.png` |
| Screenshots 1280×800 (up to 10) | recommended | `docs/screenshots/en/*.png` (English), `docs/screenshots/ru/*.png` (Russian) |

Order and captions: see [amo.md](amo.md#4-screenshots) (`01-manager` … `06-dark-partitioned`).

## 6. Notes for certification

```
CookieTin is a cookie manager: it lists, edits, protects, imports, exports and deletes the browser's cookies. No account is needed for testing. The extension makes no network requests and loads no remote code.

How to test:
1. Open any site, e.g. https://www.bing.com, then click the CookieTin toolbar button: the menu shows the site and its cookie count.
2. "Cookies of bing.com" opens the manager. Click a cookie, change its value, click Save.
3. Click Protect, then in the toolbar menu click "Delete cookies of bing.com": the protected cookie stays; the others can be restored with Undo.
4. Export (top bar) → cookies.txt or JSON; Import accepts the same text back.

Permissions: cookies + access to all sites (read and change the cookies of any site — the core function), storage (settings, list of protected cookies), alarms (optional periodic cleanup, off by default), scripting (only on the active tab, to count and clear its localStorage/sessionStorage when the user opens the menu or clicks "Clear site data"), browsingData (clear the site's storage).
Source: https://github.com/Perruer/cookietin
```
