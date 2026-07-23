"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { FileText, Plus, MoreVertical, WifiOff, Users } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { documentsApi, OfflineError } from "@/lib/api";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  readCachedDocuments,
  writeCachedDocuments,
  queueCreate,
  queueDelete,
  queueRename,
  flushQueue,
  pendingCount,
} from "@/lib/offlineQueue";
import type { DocumentSummary } from "@/types";

function DocumentsPageContent() {
  const router = useRouter();
  const online = useOnlineStatus();
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingCache, setUsingCache] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(0);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await documentsApi.list();
      setDocs(list);
      writeCachedDocuments(list);
      setUsingCache(false);
    } catch (err) {
      if (err instanceof OfflineError) {
        setDocs(readCachedDocuments());
        setUsingCache(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setPending(pendingCount());
  }, [load]);

  // When connectivity returns, replay any queued edits, then refresh from
  // the source of truth. This is the reconciliation step of the local-first
  // contract for document metadata (title/create/delete).
  useEffect(() => {
    if (online) {
      flushQueue().then(() => {
        setPending(pendingCount());
        load();
      });
    }
  }, [online, load]);

  async function handleCreate() {
    setCreating(true);
    const title = "Untitled document";
    if (online) {
      try {
        const doc = await documentsApi.create(title);
        router.push(`/documents/${doc._id}`);
        return;
      } catch (err) {
        if (!(err instanceof OfflineError)) {
          setCreating(false);
          return;
        }
      }
    }
    // Offline (or the create call failed to reach the server): stage the
    // doc locally with a client-generated id so editing can start right
    // away; it reconciles with the server the moment we're back online.
    const tempId = `local-${crypto.randomUUID()}`;
    const optimistic: DocumentSummary = {
      _id: tempId,
      title,
      role: "owner",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      collaboratorCount: 1,
    };
    const next = [optimistic, ...docs];
    setDocs(next);
    writeCachedDocuments(next);
    queueCreate(tempId, title);
    setPending(pendingCount());
    setCreating(false);
    router.push(`/documents/${tempId}`);
  }

  async function handleRename(doc: DocumentSummary, title: string) {
    const next = docs.map((d) => (d._id === doc._id ? { ...d, title } : d));
    setDocs(next);
    writeCachedDocuments(next);
    if (online) {
      try {
        await documentsApi.rename(doc._id, title);
        return;
      } catch {
        // fall through to queue
      }
    }
    queueRename(doc._id, title);
    setPending(pendingCount());
  }

  async function handleDelete(doc: DocumentSummary) {
    const next = docs.filter((d) => d._id !== doc._id);
    setDocs(next);
    writeCachedDocuments(next);
    setMenuOpenFor(null);
    if (online) {
      try {
        await documentsApi.remove(doc._id);
        return;
      } catch {
        // fall through to queue
      }
    }
    queueDelete(doc._id);
    setPending(pendingCount());
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <Navbar />

      {(!online || usingCache || pending > 0) && (
        <div className="flex items-center gap-2 border-b border-amber/30 bg-amber/10 px-5 py-2 text-sm text-ink-700">
          <WifiOff size={15} className="shrink-0" />
          {!online
            ? "You're offline. Changes are saved locally and will sync automatically when you're back online."
            : pending > 0
            ? `Reconnected — syncing ${pending} pending change${pending === 1 ? "" : "s"}…`
            : "Showing your last synced documents."}
        </div>
      )}

      <main className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink-950">Your documents</h1>
            <p className="mt-1 text-sm text-ink-500">
              {docs.length} document{docs.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-dark disabled:opacity-60"
          >
            <Plus size={16} />
            New document
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-ink-100" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-white py-20 text-center">
            <FileText className="mx-auto mb-3 text-ink-300" size={32} />
            <p className="text-ink-600">No documents yet.</p>
            <p className="mt-1 text-sm text-ink-400">Create your first document to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <div
                key={doc._id}
                className="group relative cursor-pointer rounded-xl border border-ink-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-signal/40"
                onClick={() => router.push(`/documents/${doc._id}`)}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-signal-soft text-signal-dark">
                    <FileText size={17} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenFor(menuOpenFor === doc._id ? null : doc._id);
                    }}
                    className="rounded-md p-1 text-ink-400 opacity-0 transition hover:bg-ink-50 group-hover:opacity-100"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpenFor === doc._id && (
                    <div
                      className="absolute right-4 top-12 z-10 w-40 rounded-lg border border-ink-200 bg-white py-1 shadow-card"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="block w-full px-3 py-1.5 text-left text-sm text-ink-700 hover:bg-ink-50"
                        onClick={() => {
                          const title = prompt("Rename document", doc.title);
                          if (title) handleRename(doc, title);
                          setMenuOpenFor(null);
                        }}
                      >
                        Rename
                      </button>
                      {doc.role === "owner" && (
                        <button
                          className="block w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(doc)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <h3 className="truncate font-medium text-ink-900">{doc.title}</h3>
                <div className="mt-2 flex items-center justify-between text-xs text-ink-400">
                  <span>Edited {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                  {doc.collaboratorCount > 1 && (
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {doc.collaboratorCount}
                    </span>
                  )}
                </div>
                {doc.role !== "owner" && (
                  <span className="mt-3 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium capitalize text-ink-500">
                    {doc.role}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <ProtectedRoute>
      <DocumentsPageContent />
    </ProtectedRoute>
  );
}
