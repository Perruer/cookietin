/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import { useMemo, useState } from "preact/hooks";
import { isFirefox, t, uiLanguage } from "../shared/api";
import type { Cookie, SameSite } from "../shared/cookies";
import type { Store } from "../shared/stores";
import { DuplicateIcon, LockIcon, SaveIcon, TrashIcon, UnlockIcon } from "../ui/icons";
import { b64Decode, b64Encode, byteSize, decodeJwt, draftProblems, fromLocalInput, relativeTime, type Draft } from "./draft";

interface Props {
  draft: Draft;
  original: Cookie | null;
  dirty: boolean;
  stores: Store[];
  isProtected: boolean;
  error: string;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onProtect: () => void;
  onCancel: () => void;
}

const SAME_SITE: { value: SameSite; key: string }[] = [
  { value: "unspecified", key: "sameSiteUnspecified" },
  { value: "lax", key: "sameSiteLax" },
  { value: "strict", key: "sameSiteStrict" },
  { value: "no_restriction", key: "sameSiteNone" }
];

export function Editor(p: Props) {
  const { draft: d } = p;
  const [toolError, setToolError] = useState("");
  const jwt = useMemo(() => decodeJwt(d.value), [d.value]);
  const problems = draftProblems(d);
  const isNew = !p.original;
  const expiresAt = d.session ? undefined : fromLocalInput(d.expires);

  const tool = (fn: (v: string) => string) => {
    try {
      p.onChange({ value: fn(d.value) });
      setToolError("");
    } catch {
      setToolError(t("valueToolFailed"));
    }
  };

  const text = (key: keyof Draft, label: string, extra?: { placeholder?: string; mono?: boolean; id?: string }) => (
    <label class="f">
      <span>{label}</span>
      <input type="text" id={extra?.id || "f-" + key} class={extra?.mono ? "mono" : ""} spellcheck={false}
        placeholder={extra?.placeholder} value={(d[key] as string) ?? ""}
        onInput={e => p.onChange({ [key]: (e.target as HTMLInputElement).value } as Partial<Draft>)} />
    </label>
  );

  return (
    <form class="editor" onSubmit={e => {
      e.preventDefault();
      p.onSave();
    }}>
      <div class="ed-head">
        <h2>{isNew ? t("newCookie") : t("editCookie")}</h2>
        {p.isProtected && <span class="pill accent"><LockIcon /> {t("protected")}</span>}
        {p.dirty && <span class="pill" title={t("unsavedHint")}>{t("unsaved")}</span>}
      </div>

      {text("name", t("fieldName"), { mono: true })}

      <label class="f">
        <span class="lbl-row">
          {t("fieldValue")}
          <span class="muted small">{t("bytes", byteSize(d.name + d.value))}</span>
        </span>
        <textarea id="f-value" class="mono" rows={4} spellcheck={false} value={d.value}
          onInput={e => p.onChange({ value: (e.target as HTMLTextAreaElement).value })} />
      </label>
      <div class="tools">
        <button type="button" class="chip" onClick={() => tool(decodeURIComponent)} title={t("urlDecodeHint")}>{t("urlDecode")}</button>
        <button type="button" class="chip" onClick={() => tool(encodeURIComponent)}>{t("urlEncode")}</button>
        <button type="button" class="chip" onClick={() => tool(b64Decode)}>{t("b64Decode")}</button>
        <button type="button" class="chip" onClick={() => tool(b64Encode)}>{t("b64Encode")}</button>
        {toolError && <span class="err small">{toolError}</span>}
      </div>
      {jwt && (
        <details class="jwt">
          <summary>{t("jwtDecoded")}</summary>
          <pre class="mono">{JSON.stringify(jwt, null, 2)}</pre>
        </details>
      )}

      <div class="two">
        {text("domain", t("fieldDomain"), { mono: true, placeholder: "example.com" })}
        {text("path", t("fieldPath"), { mono: true })}
      </div>
      <label class="check inline">
        <input type="checkbox" id="f-subdomains" checked={d.includeSubdomains} onChange={e => p.onChange({ includeSubdomains: (e.target as HTMLInputElement).checked })} />
        <span>{t("fieldIncludeSubdomains")}</span>
      </label>

      <div class="two">
        <label class="f">
          <span>{t("fieldStore")}</span>
          <select id="f-store" value={d.storeId} onChange={e => p.onChange({ storeId: (e.target as HTMLSelectElement).value })}>
            {p.stores.map(s => <option value={s.id}>{s.name}</option>)}
            {!p.stores.some(s => s.id === d.storeId) && <option value={d.storeId}>{d.storeId}</option>}
          </select>
        </label>
        <label class="f">
          <span>{t("fieldSameSite")}</span>
          <select id="f-samesite" value={d.sameSite} onChange={e => p.onChange({ sameSite: (e.target as HTMLSelectElement).value as SameSite })}>
            {SAME_SITE.filter(o => !(isFirefox && o.value === "unspecified") || d.sameSite === "unspecified").map(o => <option value={o.value}>{t(o.key)}</option>)}
          </select>
        </label>
      </div>

      <div class="f">
        <span class="lbl-row">
          {t("fieldExpires")}
          {expiresAt && <span class="muted small">{relativeTime(expiresAt, uiLanguage())}</span>}
        </span>
        <div class="row">
          <input type="datetime-local" id="f-expires" step="1" value={d.expires} disabled={d.session}
            onInput={e => p.onChange({ expires: (e.target as HTMLInputElement).value })} />
          <label class="check inline">
            <input type="checkbox" id="f-session" checked={d.session} onChange={e => p.onChange({ session: (e.target as HTMLInputElement).checked })} />
            <span>{t("fieldSession")}</span>
          </label>
        </div>
      </div>

      <div class="flags">
        <label class="check inline" title={t("fieldSecureHint")}>
          <input type="checkbox" id="f-secure" checked={d.secure} onChange={e => p.onChange({ secure: (e.target as HTMLInputElement).checked })} />
          <span>Secure</span>
        </label>
        <label class="check inline" title={t("fieldHttpOnlyHint")}>
          <input type="checkbox" id="f-httponly" checked={d.httpOnly} onChange={e => p.onChange({ httpOnly: (e.target as HTMLInputElement).checked })} />
          <span>HttpOnly</span>
        </label>
      </div>

      <details class="advanced" open={!!d.partitionSite || !!d.firstPartyDomain}>
        <summary>{t("advanced")}</summary>
        {text("partitionSite", t("fieldPartition"), { mono: true, placeholder: "https://example.com", id: "f-partition" })}
        <p class="muted small hint">{t("fieldPartitionHint")}</p>
        {d.firstPartyDomain !== undefined && text("firstPartyDomain", t("fieldFirstParty"), { mono: true, id: "f-fpd" })}
      </details>

      {problems.length > 0 && (
        <ul class="problems">
          {problems.map(k => <li>{t(k)}</li>)}
        </ul>
      )}
      {p.error && <div class="err" role="alert" id="editor-error">{p.error}</div>}

      <div class="ed-actions">
        <button type="submit" id="save" disabled={!p.dirty && !isNew} title="Ctrl+S"><SaveIcon /> {t("save")}</button>
        {isNew ? (
          <button type="button" class="secondary" onClick={p.onCancel}>{t("cancel")}</button>
        ) : (
          <>
            <button type="button" class="secondary" id="protect" onClick={p.onProtect}>
              {p.isProtected ? <><UnlockIcon /> {t("unprotect")}</> : <><LockIcon /> {t("protect")}</>}
            </button>
            <button type="button" class="secondary" id="duplicate" onClick={p.onDuplicate} title={t("duplicateHint")}><DuplicateIcon /> {t("duplicate")}</button>
            <button type="button" class="danger" id="delete" onClick={p.onDelete} disabled={p.isProtected}
              title={p.isProtected ? t("unprotectFirst") : "Delete"}><TrashIcon /> {t("delete")}</button>
          </>
        )}
      </div>
    </form>
  );
}
