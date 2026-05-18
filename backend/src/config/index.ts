import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "default_dev_secret";
export const REFRESH_SECRET =
  process.env.REFRESH_SECRET || "default_dev_secret";
export const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || "fill in the .env file";
export const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || "fill in the .env file";
export const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || "fill in the .env file";
