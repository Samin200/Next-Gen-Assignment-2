import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";

// Token expiry is set via env.JWT_EXPIRES_IN (e.g. "7d") and verified by jsonwebtoken.
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";
import type { AuthenticatedRequest, AuthUser, JwtPayload } from "../utils/types.js";

/**
 * JWT verify middleware.
 * Expects header: `Authorization: <token>` (no "Bearer" prefix).
 * On success attaches `req.user` with id, name, role.
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (typeof header !== "string" || header.length === 0) {
    sendError(res, StatusCodes.UNAUTHORIZED, "Missing Authorization token");
    return;
  }

  // Reject explicit "Bearer <token>" format since spec says NO "Bearer" prefix
  if (header.toLowerCase().startsWith("bearer ")) {
    sendError(res, StatusCodes.UNAUTHORIZED, "Invalid Authorization header format");
    return;
  }

  const token = header.trim();

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user: AuthUser = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
    };
    req.user = user;
    next();
  } catch {
    sendError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token");
  }
}
