import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { badRequest, sendSuccess } from "../../utils/response.js";
import type {
  AuthenticatedRequest,
  CreateIssueBody,
  IssueListQuery,
  UpdateIssueBody,
} from "../../utils/types.js";
import * as issuesService from "./issues.service.js";

function parseId(raw: string | string[] | undefined): number {
  if (typeof raw !== "string" || raw.length === 0) {
    throw badRequest("Validation failed", { id: "id must be a positive integer" });
  }
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest("Validation failed", { id: "id must be a positive integer" });
  }
  return n;
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(badRequest("Unauthorized"));
      return;
    }
    const body = req.body as CreateIssueBody;
    const issue = await issuesService.createIssue(body, req.user);
    sendSuccess(res, StatusCodes.CREATED, "Issue created successfully", issue);
  } catch (err) {
    next(err);
  }
}

export async function list(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const query = req.query as IssueListQuery;
    const issues = await issuesService.listIssues({
      sort: query.sort,
      type: query.type,
      status: query.status,
    });
    sendSuccess(res, StatusCodes.OK, "Issues fetched successfully", issues);
  } catch (err) {
    next(err);
  }
}

export async function getById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = parseId(req.params.id);
    const issue = await issuesService.getIssueById(id);
    sendSuccess(res, StatusCodes.OK, "Issue fetched successfully", issue);
  } catch (err) {
    next(err);
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(badRequest("Unauthorized"));
      return;
    }
    const id = parseId(req.params.id);
    const body = req.body as UpdateIssueBody;
    const issue = await issuesService.updateIssue(id, body, req.user);
    sendSuccess(res, StatusCodes.OK, "Issue updated successfully", issue);
  } catch (err) {
    next(err);
  }
}
