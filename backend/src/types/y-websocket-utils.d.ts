declare module "y-websocket/bin/utils" {
  import type { IncomingMessage } from "http";
  import type WebSocket from "ws";
  import type * as Y from "yjs";

  export interface PersistenceAdapter {
    bindState: (docName: string, ydoc: Y.Doc) => Promise<void>;
    writeState: (docName: string, ydoc: Y.Doc) => Promise<void>;
  }

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    opts?: { docName?: string; gc?: boolean }
  ): void;

  export function setPersistence(persistence: PersistenceAdapter): void;
  export function getPersistence(): PersistenceAdapter | null;
  export const docs: Map<string, unknown>;
}
