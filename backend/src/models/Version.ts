import mongoose, { Schema, Document as MongooseDocument, Types } from "mongoose";

export interface IVersion extends MongooseDocument {
  document: Types.ObjectId;
  label: string;
  update: Buffer;
  createdBy: Types.ObjectId | { _id: Types.ObjectId; name: string };
  isAutosave: boolean;
  restoredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  toSummaryJSON(creatorName?: string): {
    _id: string;
    label: string;
    createdAt: Date;
    createdBy: { id: string; name: string };
    isAutosave: boolean;
  };
}

const versionSchema = new Schema<IVersion>(
  {
    document: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    label: { type: String, required: true, trim: true },

    // Full Y.encodeStateAsUpdate snapshot at save time (not a diff), so any
    // version can be restored independently of what came before/after it.
    update: { type: Buffer, required: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAutosave: { type: Boolean, default: false },
    restoredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

versionSchema.methods.toSummaryJSON = function toSummaryJSON(this: IVersion, creatorName?: string) {
  const creatorId =
    typeof this.createdBy === "object" && "_id" in this.createdBy ? this.createdBy._id : this.createdBy;
  return {
    _id: this._id.toString(),
    label: this.label,
    createdAt: this.createdAt,
    createdBy: { id: creatorId.toString(), name: creatorName || "Unknown" },
    isAutosave: this.isAutosave,
  };
};

export const Version = mongoose.model<IVersion>("Version", versionSchema);
