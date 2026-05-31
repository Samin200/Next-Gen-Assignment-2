import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Auth business logic — signup (validate + hash + insert) and login (lookup + compare + sign JWT).
import { env } from "../../config/env.js";
import pool from "../../config/db.js";
import { AppError, badRequest, unauthorized } from "../../utils/response.js";
import type { JwtPayload, PublicUser, UserRow } from "../../utils/types.js";
import { isRole, isValidEmail, isNonEmptyString, type Role } from "../../utils/validators.js";

export interface SignupInput {
  name: unknown;
  email: unknown;
  password: unknown;
  role: unknown;
}

export interface LoginInput {
  email: unknown;
  password: unknown;
}

function validateSignupInput(input: SignupInput): {
  name: string;
  email: string;
  password: string;
  role: Role;
} {
  if (!isNonEmptyString(input.name)) {
    throw badRequest("Validation failed", { name: "Name is required" });
  }
  if (!isValidEmail(input.email)) {
    throw badRequest("Validation failed", { email: "A valid email is required" });
  }
  if (typeof input.password !== "string" || input.password.length < 6) {
    throw badRequest("Validation failed", {
      password: "Password must be at least 6 characters",
    });
  }
  if (!isRole(input.role)) {
    throw badRequest("Validation failed", {
      role: "Role must be either 'contributor' or 'maintainer'",
    });
  }
  return {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    role: input.role,
  };
}

function validateLoginInput(input: LoginInput): { email: string; password: string } {
  if (!isValidEmail(input.email)) {
    throw badRequest("Validation failed", { email: "A valid email is required" });
  }
  if (typeof input.password !== "string" || input.password.length === 0) {
    throw badRequest("Validation failed", { password: "Password is required" });
  }
  return { email: input.email.trim().toLowerCase(), password: input.password };
}

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export async function signup(input: SignupInput): Promise<PublicUser> {
  const { name, email, password, role } = validateSignupInput(input);

  const existing = await pool.query<UserRow>(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  if (existing.rowCount && existing.rowCount > 0) {
    throw badRequest("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  const result = await pool.query<UserRow>(
    `INSERT INTO users (name, email, password, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING id, name, email, password, role, created_at, updated_at`,
    [name, email, passwordHash, role],
  );

  const row = result.rows[0];
  if (!row) throw new AppError(500, "Failed to create user");
  return toPublicUser(row);
}

export async function login(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
  const { email, password } = validateLoginInput(input);

  const result = await pool.query<UserRow>(
    `SELECT id, name, email, password, role, created_at, updated_at
     FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  const row = result.rows[0];
  if (!row) throw unauthorized("Invalid email or password");

  const ok = await bcrypt.compare(password, row.password);
  if (!ok) throw unauthorized("Invalid email or password");

  const token = signToken({ id: row.id, name: row.name, role: row.role });
  return { token, user: toPublicUser(row) };
}
