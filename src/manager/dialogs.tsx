/*
 * CookieTin — Copyright (C) 2026 Perruer.
 * Based on Cookie Quick Manager, Copyright (C) 2017-2019 Ysard.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
import type { ComponentChildren } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { t } from "../shared/api";
import { setCookie, type Cookie } from "../shared/cookies";
import { exportCookies, exportFileName, parseImport, type ImportResult } from "../shared/formats";
import { setProtection } from "../shared/protect";
import type { ExportFormat } from "../shared/settings";
import type { Store } from "../shared/stores";
import { downloadText, pickTextFile } from "../ui/common";
import { CloseIcon, CopyIcon, DownloadIcon, UploadIcon } from "../ui/icons";

export function Modal(p: { title: string; onClose: () => void; children: ComponentChildren; wide?: boolean; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const first = ref.current?.querySelector<HTMLElement>("textarea, select, input, button.primary");
    first?.focus();
  }, []);
  return (
    <div class="backdrop" onMouseDown={e => e.target === e.currentTarget && p.onClose()}>
      <div class={"modal" + (p.wide ? " wide" : "")} role="dialog" aria-modal="true" aria-label={p.title} ref={ref} id={p.id}>
        <div class="modal-head">
          <h2>{p.title}</h2>
          <button class="icon" onClick={p.onClose} title={t("close")}><CloseIcon /></button>
        </div>
        {p.children}
      </div>
    </div>
  );
}

export function ConfirmDialog(p: { text: string; yes: string; onYes: () => void; onClose: () => void }) {
  return (
    <Modal title={t("confirmTitle")} onClose={p.onClose} id="confirm-dialog">
      <p>{p.text}</p>
      <div class="row end">
        <button class="secondary" onClick={p.onClose}>{t("cancel")}</button>
        <button class="danger primary" id="confirm-yes" onClick={() => {
          p.onClose();
          p.onYes();
        }}>{p.yes}</button>
      </div>
    </Modal>
  );
}

type Scope = "selected" | "list" | "all";

export function ExportDialog(p: {
  selected: Cookie[];
  list: Cookie[];
  all: Cookie[];
  format: ExportFormat;
  onFormat: (f: ExportFormat) => void;
  onClose: () => void;
}) {
  const [scope, setScope] = useState<Scope>(p.selected.length ? "selected" : "list");
  const [copied, setCopied] = useState(false);
  const cookies = scope === "selected" ? p.selected : scope === "list" ? p.list : p.all;
  const text = useMemo(() => exportCookies(cookies, p.format), [cookies, p.format]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.getElementById("export-text") as HTMLTextAreaElement | null;
      ta?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scopes: [Scope, string, number][] = [
    ["selected", t("scopeSelected"), p.selected.length],
    ["list", t("scopeList"), p.list.length],
    ["all", t("scopeAll"), p.all.length]
  ];

  return (
    <Modal title={t("exportTitle")} onClose={p.onClose} wide id="export-dialog">
      <div class="row">
        {scopes.map(([value, label, n]) => (
          <label class={"seg" + (scope === value ? " sel" : "")}>
            <input type="radio" name="scope" value={value} checked={scope === value} disabled={!n} onChange={() => setScope(value)} />
            {label} <span class="count">{n}</span>
          </label>
        ))}
        <span class="grow" />
        <select id="export-format" value={p.format} onChange={e => p.onFormat((e.target as HTMLSelectElement).value as ExportFormat)} style={{ width: "auto" }}>
          <option value="json">{t("formatJson")}</option>
          <option value="netscape">{t("formatNetscape")}</option>
          <option value="header">{t("formatHeader")}</option>
          <option value="cqm">{t("formatCqm")}</option>
        </select>
      </div>
      <textarea id="export-text" class="mono" readOnly rows={14} value={text} />
      <p class="muted small">{t("exportWarning")}</p>
      <div class="row end">
        <button class="secondary" id="export-copy" onClick={copy} disabled={!cookies.length}><CopyIcon /> {copied ? t("copied") : t("copy")}</button>
        <button class="primary" id="export-download" disabled={!cookies.length}
          onClick={() => downloadText(exportFileName(p.format), text, p.format === "netscape" || p.format === "header" ? "text/plain" : "application/json")}>
          <DownloadIcon /> {t("download")}
        </button>
      </div>
    </Modal>
  );
}

export function ImportDialog(p: {
  stores: Store[];
  defaultStore: string;
  onDone: (message: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string>(p.defaultStore);
  const [protect, setProtect] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parsed: ImportResult | null = useMemo(() => {
    if (!text.trim()) return null;
    try {
      return parseImport(text);
    } catch {
      return null;
    }
  }, [text]);

  const storeIds = new Set(p.stores.map(s => s.id));
  const fallback = p.stores[0]?.id || p.defaultStore;

  const run = async () => {
    if (!parsed) return;
    setBusy(true);
    setError("");
    let ok = 0;
    let firstError = "";
    const saved: Cookie[] = [];
    for (const c of parsed.cookies) {
      const storeId = target === "file" ? (c.storeId && storeIds.has(c.storeId) ? c.storeId : fallback) : target;
      try {
        saved.push(await setCookie({ ...c, storeId } as Cookie));
        ok++;
      } catch (e) {
        firstError ||= `${c.name} @ ${c.domain}: ${(e as Error).message}`;
      }
    }
    if (protect && saved.length) await setProtection(saved, true);
    setBusy(false);
    const failed = parsed.cookies.length - ok;
    const msg = t("importedCount", ok) + (parsed.skipped ? " " + t("importSkipped", parsed.skipped) : "") + (failed ? " " + t("importFailed", failed) : "");
    if (failed) setError(msg + "\n" + firstError);
    else p.onDone(msg);
  };

  return (
    <Modal title={t("importTitle")} onClose={p.onClose} wide id="import-dialog">
      <p class="muted small">{t("importHint")}</p>
      <div class="row">
        <button class="secondary" id="import-file" onClick={async () => {
          const content = await pickTextFile(".json,.txt,application/json,text/plain");
          if (content !== null) setText(content);
        }}><UploadIcon /> {t("chooseFile")}</button>
        <span class="muted small">{t("orPaste")}</span>
      </div>
      <textarea id="import-text" class="mono" rows={10} value={text} spellcheck={false}
        placeholder={'[{"domain": ".example.com", "name": "id", "value": "…"}]'}
        onInput={e => setText((e.target as HTMLTextAreaElement).value)} />
      {text.trim() && (
        <p class="small" id="import-summary">
          {parsed
            ? t("importFound", [parsed.cookies.length, t("format_" + parsed.format)]) + (parsed.skipped ? " " + t("importSkipped", parsed.skipped) : "")
            : <span class="err">{t("importUnreadable")}</span>}
        </p>
      )}
      <div class="row">
        <label class="f inline">
          <span>{t("importInto")}</span>
          <select id="import-store" value={target} onChange={e => setTarget((e.target as HTMLSelectElement).value)} style={{ width: "auto" }}>
            <option value="file">{t("importKeepStores")}</option>
            {p.stores.map(s => <option value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label class="check inline">
          <input type="checkbox" id="import-protect" checked={protect} onChange={e => setProtect((e.target as HTMLInputElement).checked)} />
          <span>{t("importProtect")}</span>
        </label>
      </div>
      {error && <div class="err pre" role="alert">{error}</div>}
      <div class="row end">
        <button class="secondary" onClick={p.onClose}>{t("cancel")}</button>
        <button class="primary" id="import-run" disabled={busy || !parsed?.cookies.length} onClick={run}>
          <UploadIcon /> {parsed?.cookies.length ? t("importRun", parsed.cookies.length) : t("import")}
        </button>
      </div>
    </Modal>
  );
}
