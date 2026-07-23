import mongoose from "mongoose";

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/collab-editor";
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log(`[db] connected -> ${uri}`);

  mongoose.connection.on("error", (err) => {
    console.error("[db] connection error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("[db] disconnected");
  });
}
