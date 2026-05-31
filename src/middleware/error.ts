import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { sendError } from "../utils/response.js";
import { AppError } from "../utils/response.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.status, err.message, err.errors);
    return;
  }

  // eslint-disable-next-line no-console
  console.error("Unhandled error:", err);

  const message = err instanceof Error ? err.message : "Internal server error";
  sendError(res, StatusCodes.INTERNAL_SERVER_ERROR, message);
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, StatusCodes.NOT_FOUND, "Route not found");
}
