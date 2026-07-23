import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import documentsRoutes from "./routes/documents.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(): Application {
  const app = express();

  app.use(
   cors({
    origin: "*",
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
