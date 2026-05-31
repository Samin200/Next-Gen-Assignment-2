export const VALID_ROLES = ["contributor", "maintainer"] as const;
export type Role = (typeof VALID_ROLES)[number];

export const VALID_ISSUE_TYPES = ["bug", "feature_request"] as const;
export type IssueType = (typeof VALID_ISSUE_TYPES)[number];

export const VALID_STATUSES = ["open", "in_progress", "resolved"] as const;
export type IssueStatus = (typeof VALID_STATUSES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

export function isIssueType(value: unknown): value is IssueType {
  return typeof value === "string" && (VALID_ISSUE_TYPES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is IssueStatus {
  return typeof value === "string" && (VALID_STATUSES as readonly string[]).includes(value);
}

export function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
