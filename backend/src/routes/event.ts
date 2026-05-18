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

// POST /api/event/:schedule/
router.post(
  "/:sched/",
  isAuthenticated as any,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { sched } = req.params as {sched: string};
      const { title, date, weight, cycle, span } = req.body;
      const userEmail = authReq.user?.email;
      if (!userEmail || !title || !date || !weight || !cycle || !span || !sched) {
        console.log(`email: ${userEmail}, title: ${title}, date: ${date}, weight: ${weight}, cycle: ${cycle}, span: ${span}, sched: ${sched}`);
        return res.status(401).json({ error: "Missing information." });
      }

      const event = await prisma.event.create({
        data : {
          title,
          date: new Date(date),
          weight,
          cycle,
          span,
          schedule_id: sched,
        }
      });

      const part = await prisma.participates.create({
        data : {
          user_email: userEmail,
          event_id: event.event_id,
        }
      })

      return res.status(201).json({ event });
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

// POST /api/event/participation/:id/
router.post(
  "/:id/",
  isAuthenticated as any,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params as {id: string};
      const { team_id } = req.body;
      const userEmail = authReq.user?.email;
      if (!userEmail || !id || !team_id ) {
        return res.status(401).json({ error: "Missing information." });
      }

      const part = await prisma.participates.create({
        data : {
          team_id,
          event_id: id
        }
      });

      return res.status(201).json({ part });
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

// Route: GET /api/event/:schedule/?start=...&end=...&page=...&limit=...
router.get("/:schedule/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { schedule } = req.params;
    const { date } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = (page - 1) * limit;

    const whereClause: any = { schedule_id: schedule };

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date as string);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [count, rows] = await prisma.$transaction([
      prisma.event.count({
        where: whereClause,
      }),

      prisma.event.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          date: 'asc',
        },
      }),
    ]);

    return res.status(200).json({
      events: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Route: GET /api/event/:id/participants/
router.get("/:id/participants/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params as { id: string };
    const { date } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = (page - 1) * limit;

    const whereClause: any = { event_id: id };

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date as string);
      endOfDay.setUTCHours(23, 59, 59, 999);

      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [count, rows] = await prisma.$transaction([
      prisma.event.count({
        where: whereClause,
      }),

      prisma.event.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          date: 'asc',
        },
      }),
    ]);

    return res.status(200).json({
      events: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

export default router;