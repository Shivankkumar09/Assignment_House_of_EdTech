import type { Request, Response } from "express";
import { User } from "../models/User";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/HttpError";

export async function signup(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };

  if (!name?.trim() || !email?.trim() || !password) {
    throw new HttpError(400, "Name, email, and password are required.");
  }
  if (password.length < 8) {
    throw new HttpError(400, "Password must be at least 8 characters.");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new HttpError(409, "An account with this email already exists.");

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

  const token = signToken(user);
  res.status(201).json({ token, user: user.toPublicJSON() });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email?.trim() || !password) {
    throw new HttpError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new HttpError(401, "Incorrect email or password.");

  const valid = await user.comparePassword(password);
  if (!valid) throw new HttpError(401, "Incorrect email or password.");

  const token = signToken(user);
  res.json({ token, user: user.toPublicJSON() });
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user.toPublicJSON() });
}
