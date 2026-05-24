import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { JWT_SECRET } from "../config";
import { prisma } from "../database";

export interface UserPayload {
  email: string;
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
