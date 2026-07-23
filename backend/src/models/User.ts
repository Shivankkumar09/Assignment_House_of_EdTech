import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  toPublicJSON(): { id: string; name: string; email: string };
}

interface IUserModel extends Model<IUser> {
  hashPassword(plain: string): Promise<string>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(this: IUser, candidate: string) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
};

userSchema.methods.toPublicJSON = function toPublicJSON(this: IUser) {
  return { id: this._id.toString(), name: this.name, email: this.email };
};

export const User = mongoose.model<IUser, IUserModel>("User", userSchema);
