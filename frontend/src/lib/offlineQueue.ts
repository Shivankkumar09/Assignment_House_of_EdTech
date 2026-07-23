import { documentsApi } from "@/lib/api";
import type { DocumentSummary } from "@/types";

const CACHE_KEY = "docs:cache";
const QUEUE_KEY = "docs:pending-ops";

type PendingOp =
  | { id: string; type: "create"; tempId: string; title: string }
  | { id: string; type: "rename"; docId: string; title: string }
  | { id: string; type: "delete"; docId: string };

export function readCachedDocuments(): DocumentSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCachedDocuments(docs: DocumentSummary[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(docs));
}

function readQueue(): PendingOp[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(ops: PendingOp[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(ops));
}

export function queueCreate(tempId: string, title: string) {
  const ops = readQueue();
  ops.push({ id: crypto.randomUUID(), type: "create", tempId, title });
  writeQueue(ops);
}

export function queueRename(docId: string, title: string) {
  const ops = readQueue().filter((o) => !(o.type === "rename" && o.docId === docId));
  ops.push({ id: crypto.randomUUID(), type: "rename", docId, title });
  writeQueue(ops);
}

export function queueDelete(docId: string) {
  const ops = readQueue().filter(
    (o) => !((o.type === "rename" || o.type === "create") && "docId" in o && o.docId === docId)
  );
  ops.push({ id: crypto.randomUUID(), type: "delete", docId });
  writeQueue(ops);
}

export function pendingCount(): number {
  return readQueue().length;
}

// Replays queued mutations against the backend in order. Called on
// reconnect. Best-effort: if an individual op fails it is kept in the
// queue and retried on the next reconnect rather than silently dropped.
export async function flushQueue(onProgress?: () => void): Promise<void> {
  const ops = readQueue();
  if (ops.length === 0) return;

  const remaining: PendingOp[] = [];
  for (const op of ops) {
    try {
      if (op.type === "create") {
        await documentsApi.create(op.title);
      } else if (op.type === "rename") {
        await documentsApi.rename(op.docId, op.title);
      } else if (op.type === "delete") {
        await documentsApi.remove(op.docId);
      }
      onProgress?.();
    } catch {
      remaining.push(op);
    }
  }
  writeQueue(remaining);
}
