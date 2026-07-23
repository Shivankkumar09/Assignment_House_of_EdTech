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
exports.Version = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const versionSchema = new mongoose_1.Schema({
    document: { type: mongoose_1.Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    label: { type: String, required: true, trim: true },
    // Full Y.encodeStateAsUpdate snapshot at save time (not a diff), so any
    // version can be restored independently of what came before/after it.
    update: { type: Buffer, required: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    isAutosave: { type: Boolean, default: false },
    restoredAt: { type: Date, default: null },
}, { timestamps: true });
versionSchema.methods.toSummaryJSON = function toSummaryJSON(creatorName) {
    const creatorId = typeof this.createdBy === "object" && "_id" in this.createdBy ? this.createdBy._id : this.createdBy;
    return {
        _id: this._id.toString(),
        label: this.label,
        createdAt: this.createdAt,
        createdBy: { id: creatorId.toString(), name: creatorName || "Unknown" },
        isAutosave: this.isAutosave,
    };
};
exports.Version = mongoose_1.default.model("Version", versionSchema);
//# sourceMappingURL=Version.js.map