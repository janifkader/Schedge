import { Request, Response, NextFunction } from "express";
import { body, validationResult, param, query } from "express-validator";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { prisma } from "../database";
import { redis } from "../services/redis";

export interface UserPayload {
  email: string;
  name: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

/**
 * Middleware to handle validation errors from express-validator
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return res.status(400).json({ error: result.array()[0].msg });
  }
  next();
};

export const isAuthenticated = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.token;
  
  if (!token) {
    return res.status(401).json({ error: "No authentication token found" });
  }

  try {
    const tokenSignature = token.split(".").pop() || token.slice(-30);
    const cacheKey = `auth:token:${tokenSignature}`;
    const cachedUser = await redis.get<UserPayload & { is_verified: boolean }>(cacheKey);
    if (cachedUser) {
      if (!cachedUser.is_verified) {
        return res.status(403).json({ 
          error: "Please verify your email before performing this action.",
          code: "EMAIL_UNVERIFIED"
        });
      }
      req.user = cachedUser;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
    req.user = decoded;

    const dbUser = await prisma.user.findUnique({
      where: { email: decoded.email },
      select: { is_verified: true }
    });

    if (!dbUser) {
      return res.status(404).json({ error: "User account no longer exists." });
    }

    if (!dbUser.is_verified) {
      return res.status(403).json({ 
        error: "Please verify your email before performing this action.",
        code: "EMAIL_UNVERIFIED"
      });
    }

    const sessionData = {
      email: decoded.email,
      name: decoded.name,
      is_verified: dbUser.is_verified
    };

    req.user = sessionData;
    await redis.set(cacheKey, sessionData, { ex: 900 });

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }

    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Validation rules for User Registration
 * Includes check for the new profileType field
 */
export const validateRegistration = [
  body("email")
    .exists()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .exists()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .trim(),
  body("name").exists().trim().notEmpty().withMessage("Name is required"),
];

/**
 * Validation rules for User Login
 */
export const validateLogin = [
  body("email")
    .exists()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .exists()
    .notEmpty()
    .withMessage("Password must be at least 8 characters long"),
];

export const validateEvent = [
  param("sched")
    .exists()
    .isNumeric()
    .trim().escape(),
  body("title")
    .exists()
    .matches(/^[A-Za-z0-9 _.,?!-]+$/)
    .trim().escape(),
  body("weight")
    .exists()
    .isNumeric()
    .matches(/^[0-9]+$/)
    .trim().escape(),
];

export const validateTeam = [];

export const validateRequest = [];