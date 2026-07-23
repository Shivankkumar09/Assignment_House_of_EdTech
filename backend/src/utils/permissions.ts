import { Types } from "mongoose";
import { DocumentModel, IDocument, DocumentRole } from "../models/Document";
import { HttpError } from "./HttpError";

const ROLE_RANK: Record<DocumentRole, number> = { viewer: 0, editor: 1, owner: 2 };

/**
 * Loads a document and asserts the requesting user has at least `minRole`
 * access (owner > editor > viewer). Throws a 404 if the document doesn't
 * exist (also used to hide existence from users with no access at all),
 * or a 403 if the user's role isn't sufficient.
 */
export async function loadDocumentWithRole(
  docId: string,
  userId: Types.ObjectId | string,
  minRole: DocumentRole = "viewer"
): Promise<{ doc: IDocument; role: DocumentRole }> {
  const doc = await DocumentModel.findById(docId);
  if (!doc) throw new HttpError(404, "Document not found.");

  const role = doc.roleFor(userId);
  if (!role) throw new HttpError(404, "Document not found.");

  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, "You don't have permission to do that.");
  }

  return { doc, role };
}

export { ROLE_RANK };
