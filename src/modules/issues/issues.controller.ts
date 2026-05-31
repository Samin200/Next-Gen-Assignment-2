import type { NextFunction, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { badRequest, sendSuccess } from "../../utils/response.js";
import type {
  AuthenticatedRequest,
  CreateIssueBody,
  IssueListQuery,
} from "../../utils/types.js";
import * as issuesService from "./issues.service.js";

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
