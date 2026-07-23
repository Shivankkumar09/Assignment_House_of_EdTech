import mongoose, { Schema, Document as MongooseDocument, Types } from "mongoose";

export type DocumentRole = "owner" | "editor" | "viewer";

export interface ICollaborator {
  user: Types.ObjectId;
  role: "editor" | "viewer";
}

export interface IDocument extends MongooseDocument {
  title: string;
  owner: Types.ObjectId;
  collaborators: ICollaborator[];
  yState: Buffer | null;
  createdAt: Date;
  updatedAt: Date;
  roleFor(userId: Types.ObjectId | string): DocumentRole | null;
  toSummaryJSON(userId: Types.ObjectId | string): {
    _id: string;
    title: string;
    role: DocumentRole | null;
    updatedAt: Date;
    createdAt: Date;
    collaboratorCount: number;
  };
}

const collaboratorSchema = new Schema<ICollaborator>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["editor", "viewer"], required: true },
  },
  { _id: false }
);

const documentSchema = new Schema<IDocument>(
  {
    title: { type: String, required: true, trim: true, default: "Untitled document" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    collaborators: { type: [collaboratorSchema], default: [] },

    // Latest merged Yjs CRDT state (Y.encodeStateAsUpdate), kept up to date
    // by the collaboration websocket server so the document survives
    // server restarts and a brand-new client can bootstrap without needing
    // every other peer online.
    yState: { type: Buffer, default: null },
  },
  { timestamps: true }
);

documentSchema.methods.roleFor = function roleFor(
  this: IDocument,
  userId: Types.ObjectId | string
): DocumentRole | null {
  const uid = userId.toString();
  if (this.owner.toString() === uid) return "owner";
  const collab = this.collaborators.find((c) => c.user.toString() === uid);
  return collab ? collab.role : null;
};

documentSchema.methods.toSummaryJSON = function toSummaryJSON(this: IDocument, userId: Types.ObjectId | string) {
  return {
    _id: this._id.toString(),
    title: this.title,
    role: this.roleFor(userId),
    updatedAt: this.updatedAt,
    createdAt: this.createdAt,
    collaboratorCount: 1 + this.collaborators.length,
  };
};

export const DocumentModel = mongoose.model<IDocument>("Document", documentSchema);
