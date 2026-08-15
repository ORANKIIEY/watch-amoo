import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { discoveryRouter, supportRouter, videosRouter } from "./routes/data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: [FRONTEND_ORIGIN, "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "watchamoo-backend" });
});

app.use("/api/auth", authRouter);
app.use("/api/videos", videosRouter);
app.use("/api/support", supportRouter);
app.use("/api/discovery", discoveryRouter);

app.listen(PORT, () => {
  console.log(`watchamoo backend listening on http://localhost:${PORT}`);
});
