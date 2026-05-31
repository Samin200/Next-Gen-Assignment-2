import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  JWT_SECRET: process.env.JWT_SECRET ?? "devpulse-dev-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  BCRYPT_ROUNDS: Number(process.env.BCRYPT_ROUNDS ?? 10),
} as const;
