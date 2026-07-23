"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachCollabServer = attachCollabServer;
const url_1 = require("url");
const mongoose_1 = __importDefault(require("mongoose"));
const Y = __importStar(require("yjs"));
const ws_1 = require("ws");
const utils_1 = require("y-websocket/bin/utils");
const jwt_1 = require("../utils/jwt");
const Document_1 = require("../models/Document");
const DEBOUNCE_MS = 2000;
const debounceTimers = new Map();
async function persistNow(docName, ydoc) {
    if (!mongoose_1.default.isValidObjectId(docName))
        return;
    const update = Buffer.from(Y.encodeStateAsUpdate(ydoc));
    await Document_1.DocumentModel.findByIdAndUpdate(docName, { yState: update });
}
function schedulePersist(docName, ydoc) {
    clearTimeout(debounceTimers.get(docName));
    debounceTimers.set(docName, setTimeout(() => {
        persistNow(docName, ydoc).catch((err) => console.error(`[collab] persist failed for ${docName}:`, err.message));
    }, DEBOUNCE_MS));
}
// Bridges Yjs's in-memory document state to MongoDB, so a document's
// content survives server restarts and a brand-new client can bootstrap
// its local IndexedDB copy even if no other peer is currently online.
(0, utils_1.setPersistence)({
    bindState: async (docName, ydoc) => {
        if (mongoose_1.default.isValidObjectId(docName)) {
            const doc = await Document_1.DocumentModel.findById(docName).select("yState");
            if (doc?.yState?.length) {
                Y.applyUpdate(ydoc, doc.yState);
            }
        }
        ydoc.on("update", () => schedulePersist(docName, ydoc));
    },
    writeState: async (docName, ydoc) => {
        clearTimeout(debounceTimers.get(docName));
        debounceTimers.delete(docName);
        await persistNow(docName, ydoc);
    },
});
function rejectUpgrade(socket, status, message) {
    socket.write(`HTTP/1.1 ${status} ${message}\r\n\r\n`);
    socket.destroy();
}
/**
 * Attaches the Yjs collaboration endpoint to an existing HTTP server at
 * `/collab/:docId`. The frontend connects via y-websocket's
 * WebsocketProvider(WS_URL, docId, ydoc, { params: { token } }), which
 * produces exactly this URL shape.
 */
function attachCollabServer(httpServer) {
    const wss = new ws_1.WebSocketServer({ noServer: true });
    httpServer.on("upgrade", async (req, socket, head) => {
        let url;
        try {
            url = new url_1.URL(req.url || "", "http://localhost");
        }
        catch {
            return rejectUpgrade(socket, 400, "Bad Request");
        }
        const match = url.pathname.match(/^\/collab\/([^/]+)\/?$/);
        if (!match)
            return rejectUpgrade(socket, 404, "Not Found");
        const docId = decodeURIComponent(match[1]);
        const token = url.searchParams.get("token");
        if (!token)
            return rejectUpgrade(socket, 401, "Unauthorized");
        let userId;
        try {
            userId = (0, jwt_1.verifyToken)(token).sub;
        }
        catch {
            return rejectUpgrade(socket, 401, "Unauthorized");
        }
        if (!mongoose_1.default.isValidObjectId(docId))
            return rejectUpgrade(socket, 404, "Not Found");
        const doc = await Document_1.DocumentModel.findById(docId).select("owner collaborators");
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
    wss.on("connection", (ws, req, ctx) => {
        (0, utils_1.setupWSConnection)(ws, req, { docName: ctx.docId, gc: true });
    });
    return wss;
}
//# sourceMappingURL=collabServer.js.map