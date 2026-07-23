import type { Request, Response } from "express";
import { Version, IVersion } from "../models/Version";
import { HttpError } from "../utils/HttpError";
import { loadDocumentWithRole } from "../utils/permissions";

export async function list(req: Request, res: Response): Promise<void> {
  await loadDocumentWithRole(req.params.id, req.user._id, "viewer");

  const versions = await Version.find({ document: req.params.id })
    .sort({ createdAt: -1 })
    .populate<{ createdBy: { _id: unknown; name: string } }>("createdBy", "name");

  res.json({
    versions: versions.map((v) => v.toSummaryJSON((v.createdBy as { name?: string })?.name)),
  });
}

export async function save(req: Request, res: Response): Promise<void> {
  await loadDocumentWithRole(req.params.id, req.user._id, "editor");

  const { label, update } = req.body as { label?: string; update?: string };
  if (!update) throw new HttpError(400, "A base64-encoded Yjs update is required.");

  const version: IVersion = await Version.create({
    document: req.params.id,
    label: (label || "").trim() || "Untitled version",
    update: Buffer.from(update, "base64"),
    createdBy: req.user._id,
  });

  res.status(201).json({ version: version.toSummaryJSON(req.user.name) });
}

export async function getSnapshot(req: Request, res: Response): Promise<void> {
  await loadDocumentWithRole(req.params.id, req.user._id, "viewer");

  const version = await Version.findOne({ _id: req.params.versionId, document: req.params.id });
  if (!version) throw new HttpError(404, "Version not found.");

  res.json({ update: version.update.toString("base64") });
}

export async function restore(req: Request, res: Response): Promise<void> {
  // Restoring only requires editor access: the actual content change is
  // applied client-side as a normal collaborative edit (see the frontend's
  // VersionHistoryPanel), so this endpoint is an audit-trail marker rather
  // than a destructive server-side operation.
  await loadDocumentWithRole(req.params.id, req.user._id, "editor");

  const version = await Version.findOne({ _id: req.params.versionId, document: req.params.id });
  if (!version) throw new HttpError(404, "Version not found.");

  version.restoredAt = new Date();
  await version.save();

  res.json({ ok: true, restoredAt: version.restoredAt });
}
