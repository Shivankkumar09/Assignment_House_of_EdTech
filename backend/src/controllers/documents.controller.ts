import type { Request, Response } from "express";
import { DocumentModel } from "../models/Document";
import { Version } from "../models/Version";
import { User } from "../models/User";
import { HttpError } from "../utils/HttpError";
import { loadDocumentWithRole } from "../utils/permissions";

export async function list(req: Request, res: Response): Promise<void> {
  const docs = await DocumentModel.find({
    $or: [{ owner: req.user._id }, { "collaborators.user": req.user._id }],
  }).sort({ updatedAt: -1 });

  res.json({ documents: docs.map((d) => d.toSummaryJSON(req.user._id)) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const title = ((req.body.title as string) || "Untitled document").trim() || "Untitled document";
  const doc = await DocumentModel.create({ title, owner: req.user._id });
  res.status(201).json({ document: doc.toSummaryJSON(req.user._id) });
}

export async function get(req: Request, res: Response): Promise<void> {
  const { doc } = await loadDocumentWithRole(req.params.id, req.user._id, "viewer");
  res.json({
    document: {
      ...doc.toSummaryJSON(req.user._id),
      snapshot: doc.yState ? doc.yState.toString("base64") : null,
    },
  });
}

export async function rename(req: Request, res: Response): Promise<void> {
  const { doc } = await loadDocumentWithRole(req.params.id, req.user._id, "editor");
  const title = ((req.body.title as string) || "").trim();
  if (!title) throw new HttpError(400, "Title cannot be empty.");
  doc.title = title;
  await doc.save();
  res.json({ document: doc.toSummaryJSON(req.user._id) });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { doc } = await loadDocumentWithRole(req.params.id, req.user._id, "owner");
  await Version.deleteMany({ document: doc._id });
  await doc.deleteOne();
  res.status(204).send();
}

export async function invite(req: Request, res: Response): Promise<void> {
  const { doc } = await loadDocumentWithRole(req.params.id, req.user._id, "owner");
  const { email, role } = req.body as { email?: string; role?: string };

  if (!email?.trim() || !["editor", "viewer"].includes(role || "")) {
    throw new HttpError(400, "A valid email and role ('editor' or 'viewer') are required.");
  }

  const invitee = await User.findOne({ email: email.toLowerCase().trim() });
  if (!invitee) {
    throw new HttpError(404, "No account exists with that email yet — ask them to sign up first.");
  }
  if (invitee._id.equals(doc.owner)) {
    throw new HttpError(400, "That user already owns this document.");
  }

  const existing = doc.collaborators.find((c) => c.user.equals(invitee._id));
  if (existing) {
    existing.role = role as "editor" | "viewer";
  } else {
    doc.collaborators.push({ user: invitee._id, role: role as "editor" | "viewer" });
  }
  await doc.save();

  res.json({ document: doc.toSummaryJSON(req.user._id), invited: { email: invitee.email, role } });
}
