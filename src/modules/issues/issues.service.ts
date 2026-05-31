import pool from "../../config/db.js";
import { AppError, badRequest } from "../../utils/response.js";
import type {
  AuthUser,
  CreateIssueBody,
  IssueRow,
  IssueWithReporter,
  PublicUser,
  ReporterInfo,
} from "../../utils/types.js";
import { isIssueType, isStatus, isNonEmptyString, type IssueStatus, type IssueType } from "../../utils/validators.js";

export interface IssueListParams {
  sort?: unknown;
  type?: unknown;
  status?: unknown;
}

function validateCreateIssue(input: CreateIssueBody): {
  title: string;
  description: string;
  type: IssueType;
} {
  const errors: Record<string, string> = {};
  if (!isNonEmptyString(input.title)) errors.title = "Title is required";
  else if (input.title.length > 150)
    errors.title = "Title must be 150 characters or fewer";
  if (!isNonEmptyString(input.description))
    errors.description = "Description is required";
  if (!isIssueType(input.type))
    errors.type = "Type must be 'bug' or 'feature_request'";

  if (Object.keys(errors).length > 0) throw badRequest("Validation failed", errors);

  return {
    title: (input.title as string).trim(),
    description: (input.description as string).trim(),
    type: input.type as IssueType,
  };
}

async function fetchReporters(ids: number[]): Promise<Map<number, ReporterInfo>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();

  const placeholders = unique.map((_, i) => `$${i + 1}`).join(", ");
  const result = await pool.query<PublicUser>(
    `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
    unique,
  );
  const map = new Map<number, ReporterInfo>();
  for (const row of result.rows) {
    map.set(row.id, { id: row.id, name: row.name, role: row.role });
  }
  return map;
}

function attachReporters(
  issues: IssueRow[],
  reporters: Map<number, ReporterInfo>,
): IssueWithReporter[] {
  return issues.map((issue) => {
    const reporter = reporters.get(issue.reporter_id);
    if (!reporter) {
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: { id: issue.reporter_id, name: "Unknown", role: "contributor" },
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      };
    }
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    };
  });
}

export async function createIssue(
  body: CreateIssueBody,
  reporter: AuthUser,
): Promise<IssueRow> {
  const { title, description, type } = validateCreateIssue(body);

  const result = await pool.query<IssueRow>(
    `INSERT INTO issues (title, description, type, status, reporter_id, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', $4, NOW(), NOW())
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, reporter.id],
  );

  const row = result.rows[0];
  if (!row) throw new AppError(500, "Failed to create issue");
  return row;
}

export async function listIssues(params: IssueListParams): Promise<IssueWithReporter[]> {
  const whereClauses: string[] = [];
  const values: Array<string | number> = [];
  let paramIndex = 1;

  const sort = params.sort === "oldest" ? "oldest" : "newest";

  if (isIssueType(params.type)) {
    whereClauses.push(`type = $${paramIndex++}`);
    values.push(params.type);
  } else if (params.type !== undefined && params.type !== "") {
    throw badRequest("Validation failed", {
      type: "Type must be 'bug' or 'feature_request'",
    });
  }

  if (isStatus(params.status)) {
    whereClauses.push(`status = $${paramIndex++}`);
    values.push(params.status as IssueStatus);
  } else if (params.status !== undefined && params.status !== "") {
    throw badRequest("Validation failed", {
      status: "Status must be 'open', 'in_progress', or 'resolved'",
    });
  }

  const where =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const order = sort === "oldest" ? "ASC" : "DESC";

  const sql = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
               FROM issues
               ${where}
               ORDER BY created_at ${order}, id ${order}`;

  const result = await pool.query<IssueRow>(sql, values);
  const issues = result.rows;

  const reporters = await fetchReporters(issues.map((i) => i.reporter_id));
  return attachReporters(issues, reporters);
}
