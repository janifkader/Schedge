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
import { createEvents, EventAttributes } from "ics";

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

// GET /api/schedule/:sched/export/?date=...
router.get("/:sched/export/", isAuthenticated as any,
  async (req: Request, res: Response) => {
    try {
      const { sched } = req.params as { sched: string };
      const { date } = req.query;

      const whereClause: any = { schedule_id: sched };

      if (date) {
        const startOfDay = new Date(date as string);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        whereClause.start_time = { gte: startOfDay, lt: endOfDay };
      }

      const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { start_time: "asc" },
      });

      const icsEvents: EventAttributes[] = events.map((e) => {
        const start = new Date(e.start_time);
        const end = new Date(e.end_time);
        return {
          uid: e.event_id,
          title: e.title,
          start: [
            start.getUTCFullYear(),
            start.getUTCMonth() + 1,
            start.getUTCDate(),
            start.getUTCHours(),
            start.getUTCMinutes(),
          ],
          end: [
            end.getUTCFullYear(),
            end.getUTCMonth() + 1,
            end.getUTCDate(),
            end.getUTCHours(),
            end.getUTCMinutes(),
          ],
          recurrenceRule: e.cycle !== "None" ? `FREQ=${e.cycle.toUpperCase()}` : undefined,
        };
      });

      const { error, value } = createEvents(icsEvents);

      if (error || !value) {
        return res.status(500).json({ error: "Failed to generate ICS file." });
      }

      res.setHeader("Content-Type", "text/calendar;charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="schedge-export.ics"`);
      return res.send(value);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to export events." });
    }
  }
);

export default router;