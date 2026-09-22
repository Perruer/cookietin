import { test } from "node:test";
import assert from "node:assert/strict";
import { cookieKey, cookieUrl, normalizeSameSite, nowSeconds, toSetDetails, type Cookie } from "../../src/shared/cookies";
import { baseDomain, bareDomain, domainInSite, hostOf, siteHost } from "../../src/shared/domain";
import { exportCookies, parseImport, toCqmJson, toHeader, toJson, toNetscape } from "../../src/shared/formats";
import { isProtected, withProtection, countProtected } from "../../src/shared/protect";
import { matchesCookie, parseQuery } from "../../src/shared/search";
import { siteCookies } from "../../src/shared/cleanup";
import { b64Decode, b64Encode, cookieFromDraft, decodeJwt, draftFromCookie, draftProblems, fromLocalInput, newDraft, toLocalInput } from "../../src/manager/draft";

const future = nowSeconds() + 86400 * 30;

function cookie(p: Partial<Cookie>): Cookie {
  return {
    name: "id", value: "v", domain: ".example.com", path: "/", secure: true, httpOnly: false,
    sameSite: "lax", session: false, expirationDate: future, hostOnly: false, storeId: "0", ...p
  };
}

test("domain helpers", () => {
  assert.equal(bareDomain(".example.com"), "example.com");
  assert.equal(baseDomain("www.shop.example.com"), "example.com");
  assert.equal(baseDomain("a.b.example.co.uk"), "example.co.uk");
  assert.equal(baseDomain("user.github.io"), "user.github.io");
  assert.equal(baseDomain("localhost"), "localhost");
  assert.equal(baseDomain("127.0.0.1"), "127.0.0.1");
  assert.equal(baseDomain(".mail.yandex.ru"), "yandex.ru");
  assert.ok(domainInSite(".accounts.example.com", "example.com"));
  assert.ok(domainInSite("example.com", "example.com"));
  assert.ok(!domainInSite("notexample.com", "example.com"));
  assert.equal(hostOf("https://www.example.com/a?b"), "www.example.com");
  assert.equal(hostOf("about:blank"), "");
  assert.equal(hostOf("chrome://extensions"), "");
  assert.equal(siteHost("https://example.com"), "example.com");
  assert.equal(siteHost("example.com"), "example.com");
});

test("cookie url, key and set details", () => {
  assert.equal(cookieUrl(cookie({})), "https://example.com/");
  assert.equal(cookieUrl(cookie({ secure: false, domain: "a.test", path: "/x" })), "http://a.test/x");
  const a = cookie({});
  const b = cookie({ partitionKey: { topLevelSite: "https://news.test" } });
  assert.notEqual(cookieKey(a), cookieKey(b));
  assert.equal(cookieKey(a), cookieKey({ ...a, value: "other" }));

  const hostOnly = toSetDetails(cookie({ domain: "www.example.com", hostOnly: true }));
  assert.equal(hostOnly.domain, undefined, "host-only cookies are set without a domain");
  const wide = toSetDetails(cookie({ domain: "example.com", hostOnly: false }));
  assert.equal(wide.domain, ".example.com");
  const session = toSetDetails(cookie({ session: true, expirationDate: undefined }));
  assert.equal(session.expirationDate, undefined);
  const part = toSetDetails(b);
  assert.deepEqual(part.partitionKey, { topLevelSite: "https://news.test" });
  assert.equal(normalizeSameSite("None"), "no_restriction");
  assert.equal(normalizeSameSite("Lax"), "lax");
  assert.equal(normalizeSameSite(undefined), "unspecified");
});

test("search: domains, name:, value:, legacy syntax", () => {
  const q = parseQuery('google name:SID value:"a b" :name:"NID"');
  assert.deepEqual(q.domains, ["google"]);
  assert.deepEqual(q.names, ["SID", "NID"]);
  assert.deepEqual(q.values, ["a b"]);
  assert.ok(matchesCookie(cookie({ domain: ".google.com", name: "SID", value: "xa by" }), q));
  assert.ok(!matchesCookie(cookie({ domain: ".google.com", name: "SID", value: "zzz" }), q));
  assert.ok(!matchesCookie(cookie({ domain: ".bing.com", name: "SID", value: "a b" }), q));
  // A partitioned cookie is found by the site it is stored for.
  const embedded = cookie({ domain: ".video.test", partitionKey: { topLevelSite: "https://news.example" } });
  assert.ok(matchesCookie(embedded, parseQuery("news.example")));
  assert.ok(matchesCookie(cookie({}), parseQuery("")));
});

test("site cookies include partitioned cookies stored under the site", () => {
  const list = [
    cookie({ domain: ".example.com", name: "a" }),
    cookie({ domain: "www.example.com", name: "b", hostOnly: true }),
    cookie({ domain: ".tracker.test", name: "c", partitionKey: { topLevelSite: "https://example.com" } }),
    cookie({ domain: ".tracker.test", name: "d" }),
    cookie({ domain: ".other.com", name: "e" })
  ];
  assert.deepEqual(siteCookies(list, "example.com").map(c => c.name), ["a", "b", "c"]);
});

test("protection map (Cookie Quick Manager layout)", () => {
  let map = withProtection({}, [{ domain: ".example.com", name: "sid" }, { domain: ".example.com", name: "pref" }], true);
  assert.deepEqual(map, { ".example.com": ["sid", "pref"] });
  assert.ok(isProtected(map, { domain: ".example.com", name: "sid" }));
  assert.ok(!isProtected(map, { domain: "example.com", name: "sid" }));
  map = withProtection(map, [{ domain: ".example.com", name: "sid" }], false);
  assert.deepEqual(map, { ".example.com": ["pref"] });
  map = withProtection(map, [{ domain: ".example.com", name: "pref" }], false);
  assert.deepEqual(map, {}, "empty domains are dropped");
  assert.equal(countProtected({ a: ["1", "2"], b: ["3"] }), 3);
});

test("export: Netscape cookies.txt is what curl and yt-dlp expect", () => {
  const txt = toNetscape([
    cookie({ domain: ".example.com", name: "wide", value: "1", expirationDate: 2000000000 }),
    cookie({ domain: "www.example.com", hostOnly: true, name: "host", value: "2", secure: false, session: true, expirationDate: undefined }),
    cookie({ domain: ".example.com", name: "hidden", value: "3", httpOnly: true, expirationDate: 2000000000 })
  ]);
  const lines = txt.trim().split("\n");
  assert.equal(lines[0], "# Netscape HTTP Cookie File");
  assert.ok(lines.includes(".example.com\tTRUE\t/\tTRUE\t2000000000\twide\t1"));
  assert.ok(lines.includes("www.example.com\tFALSE\t/\tFALSE\t0\thost\t2"));
  assert.ok(lines.includes("#HttpOnly_.example.com\tTRUE\t/\tTRUE\t2000000000\thidden\t3"));
});

test("export → import round trips", () => {
  const list = [
    cookie({ name: "a", value: "x;y=\"z\"\\", httpOnly: true, sameSite: "strict" }),
    cookie({ name: "b", domain: "host.test", hostOnly: true, secure: false, session: true, expirationDate: undefined, sameSite: "unspecified" }),
    cookie({ name: "c", partitionKey: { topLevelSite: "https://site.test" }, sameSite: "no_restriction" })
  ];
  const pick = (c: any) => ({ name: c.name, value: c.value, domain: c.domain, hostOnly: c.hostOnly, secure: c.secure, httpOnly: c.httpOnly, session: c.session });

  const json = parseImport(toJson(list));
  assert.equal(json.format, "json");
  assert.deepEqual(json.cookies.map(pick), list.map(pick));
  assert.equal(json.cookies[2].partitionKey?.topLevelSite, "https://site.test");
  assert.equal(json.cookies[0].sameSite, "strict");

  const ns = parseImport(toNetscape(list));
  assert.equal(ns.format, "netscape");
  assert.deepEqual(ns.cookies.map(c => [c.name, c.domain, c.hostOnly, c.httpOnly, c.session]),
    [["a", ".example.com", false, true, false], ["b", "host.test", true, false, true], ["c", ".example.com", false, false, false]]);

  const cqm = parseImport(toCqmJson(list));
  assert.equal(cqm.format, "cqm");
  assert.deepEqual(cqm.cookies.map(pick), list.map(pick));

  assert.equal(toHeader(list), 'a=x;y="z"\\; b=v; c=v');
  assert.equal(exportCookies(list, "header"), toHeader(list));
});

test("import: files from other tools", () => {
  // Cookie Quick Manager's own Netscape export (lowercase, "host only" column).
  const cqmTxt = `.example.com\tfalse\t/\ttrue\t${future}\tsid\tabc\nwww.example.com\ttrue\t/\tfalse\t0\tpref\tdark\n`;
  const a = parseImport(cqmTxt);
  assert.deepEqual(a.cookies.map(c => [c.domain, c.hostOnly]), [[".example.com", false], ["www.example.com", true]]);

  // Playwright storageState (expires -1 = session, SameSite capitalized).
  const pw = parseImport(JSON.stringify({ cookies: [
    { name: "s", value: "1", domain: "app.test", path: "/", expires: -1, httpOnly: true, secure: true, sameSite: "Lax" },
    { name: "p", value: "2", domain: ".app.test", path: "/", expires: future, httpOnly: false, secure: true, sameSite: "None" }
  ], origins: [] }));
  assert.equal(pw.format, "playwright");
  assert.equal(pw.cookies[0].session, true);
  assert.equal(pw.cookies[0].hostOnly, true);
  assert.equal(pw.cookies[1].sameSite, "no_restriction");
  assert.equal(pw.cookies[1].expirationDate, future);

  // EditThisCookie export.
  const etc = parseImport(JSON.stringify([{ domain: ".x.test", expirationDate: future + 0.5, hostOnly: false, httpOnly: false, name: "n", path: "/", sameSite: "unspecified", secure: false, session: false, storeId: "0", value: "v", id: 1 }]));
  assert.equal(etc.cookies[0].expirationDate, future);

  // Expired and broken entries are skipped.
  const bad = parseImport(`# comment\n.example.com\tTRUE\t/\tFALSE\t1000\told\t1\nnot a cookie line\n`);
  assert.equal(bad.cookies.length, 0);
  assert.equal(bad.skipped, 2);
  assert.throws(() => parseImport("{broken"));
  assert.equal(parseImport("  ").cookies.length, 0);
});

test("editor draft conversions and checks", () => {
  const c = cookie({ domain: ".example.com", name: "__Host-x", partitionKey: { topLevelSite: "https://a.test" } });
  const d = draftFromCookie(c);
  assert.equal(d.domain, "example.com");
  assert.equal(d.includeSubdomains, true);
  assert.equal(d.partitionSite, "https://a.test");
  const back = cookieFromDraft(d);
  assert.equal(back.domain, ".example.com");
  assert.equal(back.hostOnly, false);
  assert.equal(back.expirationDate, c.expirationDate);
  assert.ok(draftProblems(d).includes("errHostPrefix"));

  const n = newDraft("site.test", "0");
  assert.deepEqual(draftProblems(n), []);
  assert.ok(draftProblems({ ...n, secure: false, sameSite: "no_restriction" }).includes("errSameSiteNone"));
  assert.ok(draftProblems({ ...n, domain: " " }).includes("errDomainRequired"));
  assert.ok(draftProblems({ ...n, expires: "2001-01-01T00:00:00" }).includes("errExpiresPast"));
  assert.deepEqual(cookieFromDraft({ ...n, partitionSite: "news.test" }).partitionKey, { topLevelSite: "https://news.test" });
  assert.equal(fromLocalInput(toLocalInput(1900000000)), 1900000000);
});

test("value tools", () => {
  assert.equal(b64Decode(b64Encode("Привет, мир")), "Привет, мир");
  assert.equal(b64Decode("aGVsbG8"), "hello", "padding is optional");
  const jwt = "eyJhbGciOiJIUzI1NiJ9." + b64Encode(JSON.stringify({ sub: "42" })).replace(/=+$/, "") + ".sig";
  assert.deepEqual(decodeJwt(jwt)?.payload, { sub: "42" });
  assert.equal(decodeJwt("abc"), null);
});
