import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { sendError } from "../utils/response.js";
import type { AuthenticatedRequest } from "../utils/types.js";
import type { Role } from "../utils/validators.js";

/**
 * Returns middleware that enforces the authenticated user has one of the
 * allowed roles. Must be placed AFTER requireAuth in the chain.
 */
export function requireRole(...allowed: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, StatusCodes.UNAUTHORIZED, "Unauthorized");
      return;
    }

    if (!allowed.includes(req.user.role)) {
      sendError(res, StatusCodes.FORBIDDEN, "Forbidden: insufficient role");
      return;
    }

    next();
  };
}
