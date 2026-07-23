import jwt, { SignOptions } from "jsonwebtoken";
import type { IUser } from "../models/User";

export interface AccessTokenPayload {
  sub: string;
}

export function signToken(user: IUser): string {
  const secret = process.env.JWT_SECRET as string;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"],
  };
  return jwt.sign({ sub: user._id.toString() }, secret, options);
}

export function verifyToken(token: string): AccessTokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET as string) as AccessTokenPayload; // throws if invalid/expired
}
