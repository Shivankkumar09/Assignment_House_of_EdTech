"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const documents_routes_1 = __importDefault(require("./routes/documents.routes"));
const errorHandler_1 = require("./middleware/errorHandler");
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "2mb" })); // version snapshots are base64 and can be a few hundred KB
    app.use((0, morgan_1.default)("dev"));
    // Generous but present: protects auth endpoints from brute-force without
    // getting in the way of normal usage.
    const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100 });
    app.use("/api/auth", authLimiter, auth_routes_1.default);
    app.use("/api/documents", documents_routes_1.default);
    app.get("/api/health", (_req, res) => res.json({ ok: true }));
    app.use((_req, res) => res.status(404).json({ error: "Not found." }));
    app.use(errorHandler_1.errorHandler);
    return app;
}
//# sourceMappingURL=app.js.map