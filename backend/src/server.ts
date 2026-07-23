import "dotenv/config";
import http from "http";
import { createApp } from "./app";
import { connectDB } from "./config/db";
import { attachCollabServer } from "./ws/collabServer";

const PORT = process.env.PORT || 4000;

async function main(): Promise<void> {
  await connectDB();

  const app = createApp();
  const server = http.createServer(app);

  attachCollabServer(server);

  server.listen(PORT, () => {
    console.log(`[server] REST API   -> http://localhost:${PORT}/api`);
    console.log(`[server] Collab WS  -> ws://localhost:${PORT}/collab/:docId`);
  });
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
