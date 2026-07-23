"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_RANK = void 0;
exports.loadDocumentWithRole = loadDocumentWithRole;
const Document_1 = require("../models/Document");
const HttpError_1 = require("./HttpError");
const ROLE_RANK = { viewer: 0, editor: 1, owner: 2 };
exports.ROLE_RANK = ROLE_RANK;
/**
 * Loads a document and asserts the requesting user has at least `minRole`
 * access (owner > editor > viewer). Throws a 404 if the document doesn't
 * exist (also used to hide existence from users with no access at all),
 * or a 403 if the user's role isn't sufficient.
 */
async function loadDocumentWithRole(docId, userId, minRole = "viewer") {
    const doc = await Document_1.DocumentModel.findById(docId);
    if (!doc)
        throw new HttpError_1.HttpError(404, "Document not found.");
    const role = doc.roleFor(userId);
    if (!role)
        throw new HttpError_1.HttpError(404, "Document not found.");
    if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
        throw new HttpError_1.HttpError(403, "You don't have permission to do that.");
    }
    return { doc, role };
}
//# sourceMappingURL=permissions.js.map