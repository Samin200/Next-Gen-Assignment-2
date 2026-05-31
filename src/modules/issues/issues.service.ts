import pool from "../../config/db.js";
import {
  AppError,
  badRequest,
  conflict,
  forbidden,
  notFound,
} from "../../utils/response.js";

// Issues business logic — CRUD with permission checks and manual reporter resolution.
import type {
  AuthUser,
  IssueRow,
  IssueWithReporter,
  PublicUser,
  ReporterInfo,
  UpdateIssueBody,
  CreateIssueBody,
} from "../../utils/types.js";
import {
  isIssueType,
  isNonEmptyString,
  isStatus,
  type IssueStatus,
  type IssueType,
} from "../../utils/validators.js";

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

function validateUpdateIssue(input: UpdateIssueBody): {
  title?: string;
  description?: string;
  type?: IssueType;
} {
  const errors: Record<string, string> = {};
  const patch: { title?: string; description?: string; type?: IssueType } = {};

  if (input.title !== undefined) {
    if (!isNonEmptyString(input.title)) {
      errors.title = "Title must be a non-empty string";
    } else if (input.title.length > 150) {
      errors.title = "Title must be 150 characters or fewer";
    } else {
      patch.title = input.title.trim();
    }
  }
  if (input.description !== undefined) {
    if (!isNonEmptyString(input.description)) {
      errors.description = "Description must be a non-empty string";
    } else {
      patch.description = input.description.trim();
    }
  }
  if (input.type !== undefined) {
    if (!isIssueType(input.type)) {
      errors.type = "Type must be 'bug' or 'feature_request'";
    } else {
      patch.type = input.type;
    }
  }

  if (Object.keys(errors).length > 0) throw badRequest("Validation failed", errors);

  if (Object.keys(patch).length === 0) {
    throw badRequest("No valid fields provided for update");
  }
  return patch;
}

/** Validate that reporter_id references an existing user (no FK in schema). */
async function assertReporterExists(reporterId: number): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `SELECT id FROM users WHERE id = $1 LIMIT 1`,
    [reporterId],
  );
  if (!result.rowCount || result.rowCount === 0) {
    throw badRequest("Validation failed", {
      reporter_id: "Reporter does not exist",
    });
  }
}

/** Fetch reporter details for a set of ids using WHERE id IN (...). No JOINs. */
async function fetchReporters(ids: number[]): Promise<Map<number, ReporterInfo>> {
  const unique = Array.from(new Set(ids));
  if (unique.length === 0) return new Map();

  // Build a parameterized IN clause safely.
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
      // Fallback if somehow the reporter was deleted.
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
  await assertReporterExists(reporter.id);

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

export async function getIssueById(id: number): Promise<IssueWithReporter> {
  const result = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1 LIMIT 1`,
    [id],
  );
  const row = result.rows[0];
  if (!row) throw notFound("Issue not found");

  const reporters = await fetchReporters([row.reporter_id]);
  const [withReporter] = attachReporters([row], reporters);
  return withReporter;
}

export async function updateIssue(
  id: number,
  body: UpdateIssueBody,
  user: AuthUser,
): Promise<IssueRow> {
  const patch = validateUpdateIssue(body);

  const existing = await pool.query<IssueRow>(
    `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues WHERE id = $1 LIMIT 1`,
    [id],
  );
  const row = existing.rows[0];
  if (!row) throw notFound("Issue not found");

  // Permission checks
  if (user.role === "contributor") {
    if (row.reporter_id !== user.id) {
      throw forbidden("You can only update issues you reported");
    }
    if (row.status !== "open") {
      throw conflict(
        "Contributors can only update issues that are still in 'open' status",
      );
    }
  }
  // Maintainers bypass the above checks.

  // Build dynamic UPDATE (no JOINs)
  const sets: string[] = [];
  const values: Array<string | number> = [];
  let idx = 1;

  if (patch.title !== undefined) {
    sets.push(`title = $${idx++}`);
    values.push(patch.title);
  }
  if (patch.description !== undefined) {
    sets.push(`description = $${idx++}`);
    values.push(patch.description);
  }
  if (patch.type !== undefined) {
    sets.push(`type = $${idx++}`);
    values.push(patch.type);
  }
  sets.push(`updated_at = NOW()`);

  values.push(id);
  const sql = `UPDATE issues SET ${sets.join(", ")}
               WHERE id = $${idx}
               RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`;

  const updated = await pool.query<IssueRow>(sql, values);
  const updatedRow = updated.rows[0];
  if (!updatedRow) throw new AppError(500, "Failed to update issue");
  return updatedRow;
}

export async function deleteIssue(id: number): Promise<void> {
  const result = await pool.query<{ id: number }>(
    `DELETE FROM issues WHERE id = $1 RETURNING id`,
    [id],
  );
  if (!result.rowCount || result.rowCount === 0) {
    throw notFound("Issue not found");
  }
}
