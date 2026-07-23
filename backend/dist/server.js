"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const db_1 = require("./config/db");
const collabServer_1 = require("./ws/collabServer");
const PORT = process.env.PORT || 4000;
async function main() {
    await (0, db_1.connectDB)();
    const app = (0, app_1.createApp)();
    const server = http_1.default.createServer(app);
    (0, collabServer_1.attachCollabServer)(server);
    server.listen(PORT, () => {
        console.log(`[server] REST API   -> http://localhost:${PORT}/api`);
        console.log(`[server] Collab WS  -> ws://localhost:${PORT}/collab/:docId`);
    });
}
main().catch((err) => {
    console.error("[server] failed to start:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map