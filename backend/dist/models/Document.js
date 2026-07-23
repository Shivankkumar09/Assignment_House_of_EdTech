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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const collaboratorSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["editor", "viewer"], required: true },
}, { _id: false });
const documentSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true, default: "Untitled document" },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    collaborators: { type: [collaboratorSchema], default: [] },
    // Latest merged Yjs CRDT state (Y.encodeStateAsUpdate), kept up to date
    // by the collaboration websocket server so the document survives
    // server restarts and a brand-new client can bootstrap without needing
    // every other peer online.
    yState: { type: Buffer, default: null },
}, { timestamps: true });
documentSchema.methods.roleFor = function roleFor(userId) {
    const uid = userId.toString();
    if (this.owner.toString() === uid)
        return "owner";
    const collab = this.collaborators.find((c) => c.user.toString() === uid);
    return collab ? collab.role : null;
};
documentSchema.methods.toSummaryJSON = function toSummaryJSON(userId) {
    return {
        _id: this._id.toString(),
        title: this.title,
        role: this.roleFor(userId),
        updatedAt: this.updatedAt,
        createdAt: this.createdAt,
        collaboratorCount: 1 + this.collaborators.length,
    };
};
exports.DocumentModel = mongoose_1.default.model("Document", documentSchema);
//# sourceMappingURL=Document.js.map