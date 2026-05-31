import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { sendSuccess } from "../../utils/response.js";
import type { SignupBody, LoginBody } from "../../utils/types.js";
import * as authService from "./auth.service.js";

// Auth HTTP handlers — thin wrappers around auth service.

// Validate inputs first in the controller layer so malformed requests never reach the service.
export async function signup(
  req: Request<unknown, unknown, SignupBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = await authService.signup({
      name: req.body?.name,
      email: req.body?.email,
      password: req.body?.password,
      role: req.body?.role,
    });
    sendSuccess(res, StatusCodes.CREATED, "User registered successfully", user);
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginBody>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login({
      email: req.body?.email,
      password: req.body?.password,
    });
    sendSuccess(res, StatusCodes.OK, "Login successful", result);
  } catch (err) {
    next(err);
  }
}
