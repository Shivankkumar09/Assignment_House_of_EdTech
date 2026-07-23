import type { Request, Response, NextFunction, RequestHandler } from "express";
import { HttpError } from "../utils/HttpError";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

interface MongooseValidationError extends Error {
  name: "ValidationError";
  errors: Record<string, { message: string }>;
}

interface MongoDuplicateKeyError extends Error {
  code: number;
}

function isValidationError(err: unknown): err is MongooseValidationError {
  return err instanceof Error && err.name === "ValidationError";
}

function isDuplicateKeyError(err: unknown): err is MongoDuplicateKeyError {
  return err instanceof Error && (err as MongoDuplicateKeyError).code === 11000;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction): void {
  console.error("[error]", err);

  if (isValidationError(err)) {
    res.status(400).json({
      error: Object.values(err.errors)
        .map((e) => e.message)
        .join(", "),
    });
    return;
  }

  if (isDuplicateKeyError(err)) {
    res.status(409).json({ error: "That value is already in use." });
    return;
  }

  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : "Internal server error.";
  res.status(status).json({ error: message || "Internal server error." });
}
