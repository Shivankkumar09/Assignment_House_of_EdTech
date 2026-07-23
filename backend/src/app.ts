import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import documentsRoutes from "./routes/documents.routes";
import { errorHandler } from "./middleware/errorHandler";

function parseAllowedOrigins(): string[] {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:3000";
  return raw
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  const normalized = origin.replace(/\/$/, "");
  const allowed = parseAllowedOrigins();
  if (allowed.includes("*")) return true;
  if (allowed.some((entry) => entry === normalized)) return true;
  // Vercel preview/production URLs change per deployment.
  if (normalized.endsWith(".vercel.app")) return true;
  return false;
}

export function createApp(): Application {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
          callback(null, origin ?? true);
        } else {
          callback(new Error(`CORS blocked origin: ${origin}`));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(express.json({ limit: "2mb" })); // version snapshots are base64 and can be a few hundred KB
  app.use(morgan("dev"));

  // Generous but present: protects auth endpoints from brute-force without
  // getting in the way of normal usage.
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/documents", documentsRoutes);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use((_req, res) => res.status(404).json({ error: "Not found." }));
  app.use(errorHandler);

  return app;
}
