import express from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";

import authRouter from "./modules/auth/auth.router.js";
import issuesRouter from "./modules/issues/issues.router.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { sendSuccess } from "./utils/response.js";

export function createApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    sendSuccess(res, StatusCodes.OK, "ok", { status: "healthy", service: "devpulse" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/issues", issuesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
