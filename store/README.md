# Release kit — CookieTin 1.0.0

Regenerate packages with `npm run package`, screenshots and GIF with `npm run media`, tiles with
`npm run promo`, icons with `npm run icons`.

| File | What |
|---|---|
| `../dist/cookietin-firefox-1.0.0.zip` | Package for addons.mozilla.org (Firefox and Firefox for Android) |
| `../dist/cookietin-chrome-1.0.0.zip` | Package for Microsoft Edge Add-ons and GitHub Releases (manual Chrome install) |
| `../dist/cookietin-source-1.0.0.zip` | Source code for the AMO review (**required**: the code is bundled), with BUILD.md |
| [amo.md](amo.md) | AMO listing: texts EN/RU, categories, screenshots, reviewer notes |
| [edge.md](edge.md) | Edge listing: texts EN/RU, search terms, images, certification notes |
| [github-release-v1.0.0.md](github-release-v1.0.0.md) | GitHub Release text |
| `logo-300.png`, `promo-*.png` | Store images |
| `../docs/screenshots/{en,ru}/` | Screenshots 1280×800 |

## GitHub repository settings

- **Description:** Cookie manager & editor for Firefox, Edge and Chrome that sees every cookie: containers, private windows, partitioned cookies. Rewrite of Cookie Quick Manager.
- **Topics:** `browser-extension`, `firefox-addon`, `chrome-extension`, `edge-extension`, `manifest-v3`, `cookies`, `cookie-manager`, `cookie-editor`, `privacy`, `developer-tools`
- **Sponsorships:** tick *Settings → General → Features → Sponsorships* (FUNDING.yml)

## Checklist

1. [ ] `npm ci && npm test && npm run test:e2e && npm run package`
2. [ ] Push `main` and tag `v1.0.0` to github.com/Perruer/cookietin
3. [ ] GitHub Release `v1.0.0` with `cookietin-chrome-1.0.0.zip`
4. [ ] Submit to AMO (amo.md) with the source zip
5. [ ] Submit to Edge Add-ons (edge.md)
6. [ ] After approval: store links in README and release notes; attach the AMO-signed `.xpi`
