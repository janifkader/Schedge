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
import { prisma } from "../database";
import { Prisma } from "@prisma/client";

const router = express.Router();

// POST /api/schedule/
router.post(
  "/",
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userEmail = authReq.user?.email;

      if (!userEmail) {
        return res.status(401).json({ error: "Unauthorized: User email is missing." });
      }

      const sched = await prisma.schedule.create({
        data: {
          user_email: userEmail
        }
      });

      return res.status(201).json({ schedule: sched });
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

// Route: GET /api/schedule/
router.get("/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userEmail = authReq.user?.email;

    const sched = await prisma.schedule.findUnique({ where: { user_email: userEmail } });

    return res.status(200).json({
      schedule: sched
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// POST /api/schedule/:team/
router.post(
  "/:team/",
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { team } = req.params as { team: string };
      const userEmail = authReq.user?.email;

      if (!userEmail || !team) {
        return res.status(401).json({ error: "Missing information." });
      }

      const sched = await prisma.teamSchedule.create({
        data : {
          owner_email: userEmail,
          team_id: team
        }
      });

      return res.status(201).json({ schedule: sched });
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

// Route: GET /api/schedule/:team/
router.get("/:team/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { team } = req.params as { team: string };
    const userEmail = authReq.user?.email;

    const sched = await prisma.teamSchedule.findUnique({ where: { team_id: team } });

    return res.status(200).json({
      schedule: sched
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

export default router;