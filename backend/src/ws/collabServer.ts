import { URL } from "url";
import type { Server as HttpServer } from "http";
import type { Duplex } from "stream";
import mongoose from "mongoose";
import * as Y from "yjs";
import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import { setupWSConnection, setPersistence } from "y-websocket/bin/utils";
import { verifyToken } from "../utils/jwt";
import { DocumentModel } from "../models/Document";

const DEBOUNCE_MS = 2000;
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function persistNow(docName: string, ydoc: Y.Doc): Promise<void> {
  if (!mongoose.isValidObjectId(docName)) return;
  const update = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  await DocumentModel.findByIdAndUpdate(docName, { yState: update });
}

function schedulePersist(docName: string, ydoc: Y.Doc): void {
  clearTimeout(debounceTimers.get(docName));
  debounceTimers.set(
    docName,
    setTimeout(() => {
      persistNow(docName, ydoc).catch((err) =>
        console.error(`[collab] persist failed for ${docName}:`, (err as Error).message)
      );
    }, DEBOUNCE_MS)
  );
}

// Bridges Yjs's in-memory document state to MongoDB, so a document's
// content survives server restarts and a brand-new client can bootstrap
// its local IndexedDB copy even if no other peer is currently online.
setPersistence({
  bindState: async (docName: string, ydoc: Y.Doc) => {
    if (mongoose.isValidObjectId(docName)) {
      const doc = await DocumentModel.findById(docName).select("yState");
      if (doc?.yState?.length) {
        Y.applyUpdate(ydoc, doc.yState);
      }
    }
    ydoc.on("update", () => schedulePersist(docName, ydoc));
  },
  writeState: async (docName: string, ydoc: Y.Doc) => {
    clearTimeout(debounceTimers.get(docName));
    debounceTimers.delete(docName);
    await persistNow(docName, ydoc);
  },
});

function rejectUpgrade(socket: Duplex, status: number, message: string): void {
  socket.write(`HTTP/1.1 ${status} ${message}\r\n\r\n`);
  socket.destroy();
}

/**
 * Attaches the Yjs collaboration endpoint to an existing HTTP server at
 * `/collab/:docId`. The frontend connects via y-websocket's
 * WebsocketProvider(WS_URL, docId, ydoc, { params: { token } }), which
 * produces exactly this URL shape.
 */
export function attachCollabServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", async (req, socket, head) => {
    let url: URL;
    try {
      url = new URL(req.url || "", "http://localhost");
    } catch {
      return rejectUpgrade(socket, 400, "Bad Request");
    }

    const match = url.pathname.match(/^\/collab\/([^/]+)\/?$/);
    if (!match) return rejectUpgrade(socket, 404, "Not Found");

    const docId = decodeURIComponent(match[1]);
    const token = url.searchParams.get("token");

    if (!token) return rejectUpgrade(socket, 401, "Unauthorized");

    let userId: string;
    try {
      userId = verifyToken(token).sub;
    } catch {
      return rejectUpgrade(socket, 401, "Unauthorized");
    }

    if (!mongoose.isValidObjectId(docId)) return rejectUpgrade(socket, 404, "Not Found");

    const doc = await DocumentModel.findById(docId).select("owner collaborators");
    if (!doc || !doc.roleFor(userId)) {
      // 404 rather than 403: don't reveal whether a document exists to a
      // user with no access to it.
      return rejectUpgrade(socket, 404, "Not Found");
    }

    // NOTE (scope limitation): viewers are allowed to connect for
    // read/presence like anyone else. The frontend keeps the Tiptap editor
    // non-editable for viewers, but the Yjs sync protocol itself doesn't
    // distinguish read vs. write messages at this layer, so a modified
    // client could still send updates. A production build would add a
    // thin message-level filter here (drop `messageSync` update frames from
    // viewer connections) before handing off to setupWSConnection.

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, { docId });
    });
  });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage, ctx: { docId: string }) => {
    setupWSConnection(ws, req, { docName: ctx.docId, gc: true });
  });

  return wss;
}
