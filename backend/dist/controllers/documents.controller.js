"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = list;
exports.create = create;
exports.get = get;
exports.rename = rename;
exports.remove = remove;
exports.invite = invite;
const Document_1 = require("../models/Document");
const Version_1 = require("../models/Version");
const User_1 = require("../models/User");
const HttpError_1 = require("../utils/HttpError");
const permissions_1 = require("../utils/permissions");
async function list(req, res) {
    const docs = await Document_1.DocumentModel.find({
        $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
    }).sort({ updatedAt: -1 });
    res.json({ documents: docs.map((d) => d.toSummaryJSON(req.user._id)) });
}
async function create(req, res) {
    const title = (req.body.title || "Untitled document").trim() || "Untitled document";
    const doc = await Document_1.DocumentModel.create({ title, owner: req.user._id });
    res.status(201).json({ document: doc.toSummaryJSON(req.user._id) });
}
async function get(req, res) {
    const { doc } = await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "viewer");
    res.json({
        document: {
            ...doc.toSummaryJSON(req.user._id),
            snapshot: doc.yState ? doc.yState.toString("base64") : null,
        },
    });
}
async function rename(req, res) {
    const { doc } = await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "editor");
    const title = (req.body.title || "").trim();
    if (!title)
        throw new HttpError_1.HttpError(400, "Title cannot be empty.");
    doc.title = title;
    await doc.save();
    res.json({ document: doc.toSummaryJSON(req.user._id) });
}
async function remove(req, res) {
    const { doc } = await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "owner");
    await Version_1.Version.deleteMany({ document: doc._id });
    await doc.deleteOne();
    res.status(204).send();
}
async function invite(req, res) {
    const { doc } = await (0, permissions_1.loadDocumentWithRole)(req.params.id, req.user._id, "owner");
    const { email, role } = req.body;
    if (!email?.trim() || !["editor", "viewer"].includes(role || "")) {
        throw new HttpError_1.HttpError(400, "A valid email and role ('editor' or 'viewer') are required.");
    }
    const invitee = await User_1.User.findOne({ email: email.toLowerCase().trim() });
    if (!invitee) {
        throw new HttpError_1.HttpError(404, "No account exists with that email yet — ask them to sign up first.");
    }
    if (invitee._id.equals(doc.owner)) {
        throw new HttpError_1.HttpError(400, "That user already owns this document.");
    }
    const existing = doc.collaborators.find((c) => c.user.equals(invitee._id));
    if (existing) {
        existing.role = role;
    }
    else {
        doc.collaborators.push({ user: invitee._id, role: role });
    }
    await doc.save();
    res.json({ document: doc.toSummaryJSON(req.user._id), invited: { email: invitee.email, role } });
}
//# sourceMappingURL=documents.controller.js.map