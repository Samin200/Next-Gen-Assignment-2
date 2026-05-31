import type { Response } from "express";
import { StatusCodes } from "http-status-codes";

/**
 * Standardised API response helpers and error factory classes.
 * All controller responses should go through these helpers to guarantee
 * a consistent { success, message, data } envelope.
 */

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError<E = unknown> {
  success: false;
  message: string;
  errors?: E;
}

/** Send a standard 2xx response with the { success, message, data } envelope. */
export function sendSuccess<T>(
  res: Response,
  status: number,
  message: string,
  data: T,
): Response<ApiSuccess<T>> {
  return res.status(status).json({ success: true, message, data });
}

export function sendError<E = unknown>(
  res: Response,
  status: number,
  message: string,
  errors?: E,
): Response<ApiError<E>> {
  const body: ApiError<E> = { success: false, message };
  if (errors !== undefined) body.errors = errors;
  return res.status(status).json(body);
}

export class AppError extends Error {
  public readonly status: number;
  public readonly errors?: unknown;

  constructor(status: number, message: string, errors?: unknown) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const notFound = (message = "Resource not found"): AppError =>
  new AppError(StatusCodes.NOT_FOUND, message);

export const badRequest = (message: string, errors?: unknown): AppError =>
  new AppError(StatusCodes.BAD_REQUEST, message, errors);

export const unauthorized = (message = "Unauthorized"): AppError =>
  new AppError(StatusCodes.UNAUTHORIZED, message);

export const forbidden = (message = "Forbidden"): AppError =>
  new AppError(StatusCodes.FORBIDDEN, message);

export const conflict = (message: string): AppError =>
  new AppError(StatusCodes.CONFLICT, message);
