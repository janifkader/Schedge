import express, { Request, Response } from "express";
import { genSalt, hash, compare } from "bcrypt";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  validateRegistration,
  validateLogin,
  handleValidationErrors,
  isAuthenticated,
  AuthRequest,
} from "../middleware/middleware";
import { JWT_SECRET, REFRESH_SECRET } from "../config";
import { prisma } from "../database";
import { Prisma } from "@prisma/client";
import { sendVerificationEmail } from "../services/email";
import multer from "multer";
import { uploadAvatar } from "../services/profile";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images are allowed"));
  },
});

const router = express.Router();

export const generateAuthCookies = (email: string) => {
  const accessToken = jwt.sign({ email }, JWT_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ email }, REFRESH_SECRET, { expiresIn: "7d" });

  const accessCookie = serialize("token", accessToken, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".schedge.dev" : undefined,
    maxAge: 15 * 60,
  });

  const refreshCookie = serialize("refresh_token", refreshToken, {
    path: "/api/refresh",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? ".schedge.dev" : undefined,
    maxAge: 7 * 24 * 60 * 60,
  });

  return {
    accessToken,
    refreshToken,
    cookies: [accessCookie, refreshCookie],
  };
};

// POST /api/signup/
router.post(
  "/signup/",
  validateRegistration,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { name, email, password, phone } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }

      const salt = await genSalt(10);
      const hashedPassword = await hash(password, salt);
      
      // Generate initial verification token
      const verifyToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { refreshToken, cookies } = generateAuthCookies(
        email,
      );

      const user = await prisma.user.create({
        data : {
          email,
          name,
          password: hashedPassword,
          is_verified: false,
          verification_token: verifyToken,
          token_expires_at: expiresAt,
          phone,
          refresh_token: refreshToken,
           schedule: {
            create: {}
           }
        }
      });

      sendVerificationEmail(user.email, verifyToken);

      res.setHeader("Set-Cookie", cookies);
      return res.status(201).json({ email });
    } catch (error: any) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return res.status(400).json({ error: "A unique constraint failed on this account." });
        }
      }
      return res
        .status(500)
        .json({ error: "Internal Server Error during signup" });
    }
  }
);

// POST /api/signin/
router.post(
  "/signin/",
  validateLogin,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res
          .status(401)
          .json({ error: "An account with this email does not exist" });
      }

      if (!user.is_verified) {
        return res
          .status(403)
          .json({ error: "Please verify your account." });
      }

      const isValid = await compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Password is incorrect" });
      }

      const { refreshToken, cookies } = generateAuthCookies(user.email);
      await prisma.user.update({ where : { email }, data: { refresh_token: refreshToken } });

      res.setHeader("Set-Cookie", cookies);
      return res.json({ email: user.email });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error during signin" });
    }
  }
);

// Route: GET /api/signout/
router.get("/signout/", async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const email = authReq.user?.email;

    if (email) {
      await prisma.user.update({ where: { email }, data: { refresh_token: null }, });
    }

    const clearAccess = serialize("token", "", { path: "/", maxAge: -1 });
    const clearRefresh = serialize("refresh_token", "", {
      path: "/api/refresh",
      maxAge: -1,
    });

    res.setHeader("Set-Cookie", [clearAccess, clearRefresh]);

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Signout failed" });
  }
});

// Route: POST /api/refresh/
router.post("/refresh", async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({ error: "No refresh token provided" });
    }
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as {
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: {
        email: decoded.email,
        refresh_token: refreshToken,
      },
    });

    if (!user) {
      return res
        .status(403)
        .json({ error: "Invalid or revoked refresh token" });
    }

    const { refreshToken: newRefresh, cookies } = generateAuthCookies(
      user.email,
    );

    await prisma.user.update({ where : { email : user.email }, data: { refresh_token: newRefresh } });

    res.setHeader("Set-Cookie", cookies);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Refresh Error:", error);

    return res
      .status(403)
      .json({ error: "Session expired, please log in again" });
  }
});

// GET /api/user
router.get("/user", isAuthenticated as any, async (req: Request, res: Response) => {
  try{
      const authReq = req as AuthRequest;
      const user = await prisma.user.findUnique({ where: { email: authReq.user?.email } });
      if (!user) return res.status(404).json({ error: "User not found" });

      return res.json({
        username: user.name,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
      });
    }
    catch (error) {
      console.log(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
});
// GET /api/users/
router.get("/users/", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string || "";
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          email: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        skip: skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasMore = page < totalPages;

    return res.status(200).json({
      users,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching users for dropdown:", error);
    return res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/auth/verify/?token=XYZ...
router.get("/verify/", async (req: Request, res: Response) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Missing verification token." });
  }

  try {
    // Find the user with this exact token
    const user = await prisma.user.findUnique({
      where: { verification_token: token as string },
    });

    // If no user matches, or the token expired, reject it
    if (!user || !user.token_expires_at || user.token_expires_at < new Date()) {
      return res.status(400).json({ error: "Invalid or expired verification token." });
    }

    // Update the user to verified and wipe the token data
    await prisma.user.update({
      where: { email: user.email },
      data: {
        is_verified: true,
        verification_token: null, // Wipe the token so it can't be used again
        token_expires_at: null,
      },
    });

    return res.status(200).json({ message: "Email successfully verified! You can now log in." });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/resend/:email/
router.get("/resend/:email/", async (req: Request, res: Response) => {
  const { email } = req.params as { email: string };
  if (!email) {
    return res.status(401).json({ error: "Missing Information" });
  }
  try {
    const token = await prisma.user.findUnique({
      where: { email },
      select: { verification_token: true, }
    });
    if (!token || !token.verification_token) {
      return res.status(401).json({ error: "Please Sign Up First!" });
    }
    sendVerificationEmail(email, token.verification_token);
    return res.status(200).json({ message: "Verification email resent successfully." });
  }
  catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/user/avatar/
router.put(
  "/user/avatar/",
  isAuthenticated as any,
  upload.single("avatar"),
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const email = authReq.user?.email;
      if (!req.file) return res.status(400).json({ error: "No file uploaded." });
      const url = await uploadAvatar(req.file.buffer, email!);
      await prisma.user.update({
        where: { email },
        data: { avatar_url: url },
      });
      return res.status(200).json({ avatar_url: url });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: "Failed to upload avatar." });
    }
  }
);

// PATCH /api/user/
router.patch("/user/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { name, phone } = req.body;
    const user = await prisma.user.update({
      where: { email: authReq.user?.email },
      data: { name, phone: phone ? `+1${phone}` : undefined },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update profile." });
  }
});

// PATCH /api/user/password/
router.patch("/user/password/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { email: authReq.user?.email } });
    if (!user) return res.status(404).json({ error: "User not found." });
    const isValid = await compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ error: "Current password is incorrect." });
    const salt = await genSalt(10);
    const hashedPassword = await hash(newPassword, salt);
    await prisma.user.update({
      where: { email: user.email },
      data: { password: hashedPassword },
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Failed to change password." });
  }
});

export default router;
