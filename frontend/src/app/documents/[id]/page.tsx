"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { ArrowLeft, History, UserPlus, Eye } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Editor from "@/components/Editor";
import PresenceBar from "@/components/PresenceBar";
import SyncStatusBadge from "@/components/SyncStatusBadge";
import VersionHistoryPanel from "@/components/VersionHistoryPanel";
import { useAuth } from "@/context/AuthContext";
import { useYjsDocument } from "@/hooks/useYjsDocument";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { documentsApi, OfflineError } from "@/lib/api";
import { queueRename } from "@/lib/offlineQueue";
import type { DocumentRole } from "@/types";

const PALETTE = ["#e2574c", "#3a5bff", "#1f9e6b", "#e2a63b", "#9b5de5", "#12a2b8"];
function colorForUser(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[hash];
}

function DocumentEditorContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const online = useOnlineStatus();

  const [title, setTitle] = useState("Untitled document");
  const [role, setRole] = useState<DocumentRole>("owner");
  const [metaLoading, setMetaLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);

  const awarenessUser = useMemo(
    () => (user ? { name: user.name, color: colorForUser(user.id) } : null),
    [user]
  );

  const { ydoc, provider, status } = useYjsDocument(id, token, awarenessUser);

  useEffect(() => {
    let cancelled = false;
    documentsApi
      .get(id)
      .then((doc) => {
        if (cancelled) return;
        setTitle(doc.title);
        setRole(doc.role);
      })
      .catch((err) => {
        if (err instanceof OfflineError && !cancelled) {
          // Metadata (title/role) needs the API, but the document body is
          // still fully available offline via the local Yjs/IndexedDB copy
          // set up above — only the chrome (title, permissions) is stale.
          setRole("owner");
        }
      })
      .finally(() => !cancelled && setMetaLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleTitleBlur = useCallback(
    async (newTitle: string) => {
      if (!newTitle.trim() || newTitle === title) return;
      setTitle(newTitle);
      if (online) {
        try {
          await documentsApi.rename(id, newTitle);
          return;
        } catch {
          // fall through
        }
      }
      queueRename(id, newTitle);
    },
    [id, title, online]
  );

  async function handleInvite() {
    setInviteMsg(null);
    try {
      await documentsApi.invite(id, inviteEmail, inviteRole);
      setInviteMsg(`Invited ${inviteEmail} as ${inviteRole}.`);
      setInviteEmail("");
    } catch (err) {
      setInviteMsg(err instanceof OfflineError ? "Sharing requires a connection." : "Couldn't send that invite.");
    }
  }

  const canEdit = role !== "viewer";
  const ready = ydoc && provider && status.indexedDbSynced;

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-200 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={() => router.push("/documents")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-ink-50"
          >
            <ArrowLeft size={17} />
          </button>
          <input
            defaultValue={title}
            key={title}
            disabled={!canEdit}
            onBlur={(e) => handleTitleBlur(e.target.value)}
            className="min-w-0 truncate rounded-md px-2 py-1 font-display text-lg text-ink-950 outline-none transition hover:bg-ink-50 focus:bg-ink-50 disabled:bg-transparent"
          />
          {!canEdit && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
              <Eye size={11} /> View only
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          {ready && <SyncStatusBadge status={status} />}
          {provider && <PresenceBar provider={provider} />}
          {role === "owner" && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 rounded-md border border-ink-200 px-2.5 py-1.5 text-sm text-ink-600 hover:bg-ink-50"
            >
              <UserPlus size={14} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          <button
            onClick={() => setShowHistory((s) => !s)}
            className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition ${
              showHistory ? "border-signal bg-signal-soft text-signal-dark" : "border-ink-200 text-ink-600 hover:bg-ink-50"
            }`}
          >
            <History size={14} />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-w-0 flex-1">
          {!ready ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-signal" />
            </div>
          ) : (
            <Editor ydoc={ydoc} provider={provider} editable={canEdit} onEditorReady={setEditorInstance} />
          )}
        </div>

        {showHistory && ydoc && (
          <VersionHistoryPanel
            docId={id}
            ydoc={ydoc}
            editor={editorInstance}
            online={online}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {showInvite && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink-950/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-card">
            <h3 className="font-display text-lg text-ink-950">Share this document</h3>
            <p className="mt-1 text-sm text-ink-500">Invite someone to edit or view.</p>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="mt-4 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-signal focus:ring-2 focus:ring-signal-soft"
            />
            <div className="mt-3 flex gap-2">
              {(["editor", "viewer"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setInviteRole(r)}
                  className={`flex-1 rounded-md border px-3 py-1.5 text-sm capitalize transition ${
                    inviteRole === r ? "border-signal bg-signal-soft text-signal-dark" : "border-ink-200 text-ink-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {inviteMsg && <p className="mt-3 text-sm text-ink-600">{inviteMsg}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowInvite(false)}
                className="rounded-md px-3 py-1.5 text-sm text-ink-500 hover:bg-ink-50"
              >
                Close
              </button>
              <button
                onClick={handleInvite}
                disabled={!inviteEmail}
                className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white hover:bg-signal-dark disabled:opacity-50"
              >
                Send invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentEditorPage() {
  return (
    <ProtectedRoute>
      <DocumentEditorContent />
    </ProtectedRoute>
  );
}
