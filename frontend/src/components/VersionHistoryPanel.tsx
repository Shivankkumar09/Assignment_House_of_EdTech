"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History, Save, X, RotateCcw } from "lucide-react";
import * as Y from "yjs";
import { yDocToProsemirrorJSON } from "y-prosemirror";
import type { Editor } from "@tiptap/react";
import { documentsApi, OfflineError } from "@/lib/api";
import { uint8ArrayToBase64, base64ToUint8Array } from "@/lib/binary";
import type { DocumentVersion } from "@/types";

interface Props {
  docId: string;
  ydoc: Y.Doc;
  editor: Editor | null;
  online: boolean;
  onClose: () => void;
}

export default function VersionHistoryPanel({ docId, ydoc, editor, online, onClose }: Props) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    documentsApi
      .versions(docId)
      .then(setVersions)
      .catch((err) => {
        if (err instanceof OfflineError) {
          setError("Version history needs a connection — reconnect to view or save versions.");
        }
      })
      .finally(() => setLoading(false));
  }, [docId]);

  async function handleSave() {
    const label = prompt("Name this version (e.g. \"Before edits from Priya\")", format(new Date(), "MMM d, h:mm a"));
    if (label === null) return;
    setSaving(true);
    setError(null);
    try {
      // Snapshot the full CRDT state as of right now. Storing the whole
      // state (not just a diff) keeps restore simple and correct: any
      // saved version can be replayed on its own, independent of the
      // documents that came before or after it.
      const update = Y.encodeStateAsUpdate(ydoc);
      const version = await documentsApi.saveVersion(docId, label || "Untitled version", uint8ArrayToBase64(update));
      setVersions((v) => [version, ...v]);
    } catch (err) {
      setError(err instanceof OfflineError ? "Can't save a version while offline." : "Failed to save version.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRestore(version: DocumentVersion) {
    if (!editor) return;
    if (!confirm(`Restore "${version.label}"? This replaces the current content for everyone editing this document.`)) {
      return;
    }
    setRestoringId(version._id);
    setError(null);
    try {
      const base64 = await documentsApi.getVersionSnapshot(docId, version._id);
      const bytes = base64ToUint8Array(base64);

      // Materialize the snapshot in a scratch Y.Doc, convert it to
      // ProseMirror JSON, then hand it to the live editor's setContent.
      // Because the live editor's document is itself synced by Yjs, this
      // turns into an ordinary collaborative edit (a diff against current
      // state) rather than a destructive overwrite — it merges into the
      // CRDT history like any other change and propagates to everyone
      // currently connected.
      const tempDoc = new Y.Doc();
      Y.applyUpdate(tempDoc, bytes);
      const json = yDocToProsemirrorJSON(tempDoc, "content");
      editor.commands.setContent(json, true);
      tempDoc.destroy();
    } catch (err) {
      setError(err instanceof OfflineError ? "Can't restore while offline." : "Failed to restore this version.");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <aside className="flex h-full w-80 shrink-0 flex-col border-l border-ink-200 bg-white">
      <div className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <History size={16} className="text-ink-500" />
          <h2 className="text-sm font-semibold text-ink-900">Version history</h2>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-50">
          <X size={16} />
        </button>
      </div>

      <div className="border-b border-ink-200 p-3">
        <button
          onClick={handleSave}
          disabled={saving || !online}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-ink-950 px-3 py-2 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-40"
        >
          <Save size={14} />
          {saving ? "Saving…" : "Save current version"}
        </button>
        {!online && <p className="mt-1.5 text-xs text-ink-400">Reconnect to save or browse named versions.</p>}
      </div>

      {error && <p className="mx-3 mt-3 rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-700">{error}</p>}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-ink-100" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-ink-400">No saved versions yet.</p>
        ) : (
          <ul className="divide-y divide-ink-100">
            {versions.map((v) => (
              <li key={v._id} className="group flex items-start justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{v.label}</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {format(new Date(v.createdAt), "MMM d, yyyy · h:mm a")} · {v.createdBy.name}
                  </p>
                  {v.isAutosave && (
                    <span className="mt-1 inline-block rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                      Autosave
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRestore(v)}
                  disabled={restoringId !== null || !online}
                  title="Restore this version"
                  className="mt-0.5 flex shrink-0 items-center gap-1 rounded-md border border-ink-200 px-2 py-1 text-xs text-ink-600 opacity-0 transition hover:bg-ink-50 group-hover:opacity-100 disabled:opacity-40"
                >
                  <RotateCcw size={12} />
                  {restoringId === v._id ? "Restoring…" : "Restore"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
