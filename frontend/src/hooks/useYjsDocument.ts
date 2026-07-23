"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { WebsocketProvider } from "y-websocket";
import { getWsUrl } from "@/lib/env";

export interface SyncState {
  indexedDbSynced: boolean; // local cache loaded — editor is usable even fully offline
  online: boolean; // websocket connection is open
  synced: boolean; // server has confirmed our state vector diff has been exchanged
  peers: number; // other collaborators currently present (via awareness)
}

interface UseYjsDocumentResult {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  status: SyncState;
}

/**
 * Local-first collaborative document primitive.
 *
 * Every keystroke is applied to an in-memory Yjs CRDT, written to IndexedDB
 * immediately (so it survives offline use and page reloads), and broadcast
 * over WebSocket when a connection is available. Because Yjs's CRDT merge
 * is commutative and associative, concurrent edits from multiple clients —
 * including edits made entirely offline and reconciled later — always
 * converge to the same document state, deterministically, with no manual
 * conflict resolution and no last-writer-wins data loss.
 */
export function useYjsDocument(
  docId: string | null,
  token: string | null,
  user: { name: string; color: string } | null
): UseYjsDocumentResult {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState<SyncState>({
    indexedDbSynced: false,
    online: false,
    synced: false,
    peers: 0,
  });

  useEffect(() => {
    if (!docId || !user) return;

    const doc = new Y.Doc();

    const persistence = new IndexeddbPersistence(`marginal-doc-${docId}`, doc);
    persistence.on("synced", () => {
      setStatus((s) => ({ ...s, indexedDbSynced: true }));
    });

    const wsProvider = new WebsocketProvider(getWsUrl(), docId, doc, {
      params: token ? { token } : {},
      connect: true,
    });

    wsProvider.awareness.setLocalStateField("user", {
      name: user.name,
      color: user.color,
    });

    wsProvider.on("status", ({ status: s }: { status: string }) => {
      setStatus((prev) => ({ ...prev, online: s === "connected" }));
    });

    wsProvider.on("sync", (isSynced: boolean) => {
      setStatus((prev) => ({ ...prev, synced: isSynced }));
    });

    const updatePeers = () => {
      setStatus((prev) => ({ ...prev, peers: wsProvider.awareness.getStates().size }));
    };
    wsProvider.awareness.on("change", updatePeers);
    updatePeers();

    setYdoc(doc);
    setProvider(wsProvider);

    return () => {
      wsProvider.awareness.off("change", updatePeers);
      wsProvider.destroy();
      persistence.destroy();
      doc.destroy();
      setYdoc(null);
      setProvider(null);
      setStatus({ indexedDbSynced: false, online: false, synced: false, peers: 0 });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, token, user?.name, user?.color]);

  return { ydoc, provider, status };
}
