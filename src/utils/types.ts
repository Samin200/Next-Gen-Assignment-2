import type { Request } from "express";
import type { Role, IssueStatus, IssueType } from "./validators.js";

export interface JwtPayload {
  id: number;
  name: string;
  role: Role;
}

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
}

export interface ReporterInfo {
  id: number;
  name: string;
  role: Role;
}

export interface IssueRow {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface IssueWithReporter extends Omit<IssueRow, "reporter_id"> {
  reporter: ReporterInfo;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export interface SignupBody {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  role?: unknown;
}

export interface LoginBody {
  email?: unknown;
  password?: unknown;
}

export interface CreateIssueBody {
  title?: unknown;
  description?: unknown;
  type?: unknown;
}

export interface UpdateIssueBody {
  title?: unknown;
  description?: unknown;
  type?: unknown;
}

export interface IssueListQuery {
  sort?: unknown;
  type?: unknown;
  status?: unknown;
}
