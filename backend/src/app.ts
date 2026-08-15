import express from "express";
import cors from "cors";
import helmet from "helmet";
import { ok, fail } from "./utils/response.js";
import { errorHandler } from "./middleware/error.js";
import { globalLimiter } from "./middleware/rateLimit.js";
import authRoutes from "./modules/auth/auth.routes.js";
import postRoutes from "./modules/posts/posts.routes.js";
import deviceRoutes from "./modules/devices/devices.routes.js";

const app = express();

// Vercel/most PaaS put the app behind a reverse proxy - without this,
// express-rate-limit and req.ip see the proxy's IP for every request instead
// of the real client, making IP-based limits useless.
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    methods: ["GET", "POST", "DELETE"],
    // No cookies/sessions - auth is a Bearer token, so credentials aren't needed.
    credentials: false,
  })
);
app.use(express.json({ limit: "100kb" }));
// Note: hpp (HTTP Parameter Pollution) middleware was evaluated and dropped -
// it mutates req.query, which Express 5 made getter-only, so it silently
// no-ops. Duplicate query params are already rejected safely: Zod's
// z.coerce.number()/.string() reject array values with a 400, so polluted
// params fail closed instead of being silently accepted.

app.get("/health", (_req, res) => ok(res, { status: "ok" }));

app.use("/api", globalLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/devices", deviceRoutes);

app.use((_req, res) => fail(res, 404, "NOT_FOUND", "Route not found"));

app.use(errorHandler);

export default app;
