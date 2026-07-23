"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.save = save;
exports.getSnapshot = getSnapshot;
exports.restore = restore;
const Version_1 = require("../models/Version");
const HttpError_1 = require("../utils/HttpError");
const permissions_1 = require("../utils/permissions");
async function list(req, res) {
    await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "viewer");
    const versions = await Version_1.Version.find({ document: req.params.id })
        .sort({ createdAt: -1 })
        .populate("createdBy", "name");
    res.json({
        versions: versions.map((v) => v.toSummaryJSON(v.createdBy?.name)),
    });
}
async function save(req, res) {
    await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "editor");
    const { label, update } = req.body;
    if (!update)
        throw new HttpError_1.HttpError(400, "A base64-encoded Yjs update is required.");
    const version = await Version_1.Version.create({
        document: req.params.id,
        label: (label || "").trim() || "Untitled version",
        update: Buffer.from(update, "base64"),
        createdBy: req.user._id,
    });
    res.status(201).json({ version: version.toSummaryJSON(req.user.name) });
}
async function getSnapshot(req, res) {
    await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "viewer");
    const version = await Version_1.Version.findOne({ _id: req.params.versionId, document: req.params.id });
    if (!version)
        throw new HttpError_1.HttpError(404, "Version not found.");
    res.json({ update: version.update.toString("base64") });
}
async function restore(req, res) {
    // Restoring only requires editor access: the actual content change is
    // applied client-side as a normal collaborative edit (see the frontend's
    // VersionHistoryPanel), so this endpoint is an audit-trail marker rather
    // than a destructive server-side operation.
    await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "editor");
    const version = await Version_1.Version.findOne({ _id: req.params.versionId, document: req.params.id });
    if (!version)
        throw new HttpError_1.HttpError(404, "Version not found.");
    version.restoredAt = new Date();
    await version.save();
    res.json({ ok: true, restoredAt: version.restoredAt });
}
//# sourceMappingURL=versions.controller.js.map