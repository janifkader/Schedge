import express, { Request, Response } from "express";
import { genSalt, hash, compare } from "bcrypt";
import { serialize } from "cookie";
import { getConflicts, getHigherWeightConflicts, getExistingEvents } from "../utils/scheduling";
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
import { addDays, addWeeks, addMonths, addYears } from "date-fns";

const router = express.Router();

const generateRecurringEvents = (
  baseStart: Date,
  baseEnd: Date,
  cycle: string,
  horizon: Date
): { start_time: Date; end_time: Date }[] => {
  const occurrences: { start_time: Date; end_time: Date }[] = [];
  const duration = baseEnd.getTime() - baseStart.getTime();
  let currentStart = baseStart;

  while (currentStart <= horizon) {
    occurrences.push({
      start_time: currentStart,
      end_time: new Date(currentStart.getTime() + duration),
    });
    switch (cycle) {
      case "Daily":   currentStart = addDays(currentStart, 1); break;
      case "Weekly":  currentStart = addWeeks(currentStart, 1); break;
      case "Monthly": currentStart = addMonths(currentStart, 1); break;
      case "Yearly":  currentStart = addYears(currentStart, 1); break;
      default: return occurrences;
    }
  }
  return occurrences;
};

// POST /api/event/:schedule/
router.post(
  "/:sched/",
  isAuthenticated as any,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { sched } = req.params as {sched: string};
      const { title, start_time, end_time, weight, cycle, span } = req.body;
      const userEmail = authReq.user?.email;
      if (!userEmail || !title || !start_time || !end_time || !weight || !cycle || !span || !sched) {
        //console.log(`email: ${userEmail}, title: ${title}, date: ${date}, weight: ${weight}, cycle: ${cycle}, span: ${span}, sched: ${sched}`);
        return res.status(401).json({ error: "Missing information." });
      }

      const baseStart = new Date(start_time);
      const baseEnd = new Date(end_time);
      let finalSpan = new Date(end_time);

      if (baseEnd <= baseStart) {
        return res.status(400).json({ error: "End time must be after start time." });
      }

      const existing = await getExistingEvents(sched, baseStart, baseEnd);
      const conflicts = getHigherWeightConflicts({ start_time: baseStart, end_time: baseEnd, weight }, existing);

      if (conflicts.length > 0) {
        return res.status(409).json({
          error: "Conflicts with higher or equal weight events.",
          conflicts: conflicts.map((c) => ({
            event_id: c.event_id,
            title: c.title,
            start_time: c.start_time,
            end_time: c.end_time,
            weight: c.weight,
          })),
        });
      }

      if (span != "None"){
        const spanRegex = /^(\d+)\s(Weeks|Months|Years)$/;
        const match = span.match(spanRegex);
        const durationAmount = parseInt(match[1], 10);
        const durationUnit = match[2];
        const start = new Date(start_time);
        if (durationUnit === 'Weeks') {
          finalSpan = addWeeks(start, durationAmount);
        }
        else if (durationUnit === 'Months') {
          finalSpan = addMonths(start, durationAmount);
        }
        else {
          finalSpan = addYears(start, durationAmount);
        }
      }
      const occurrences = generateRecurringEvents(baseStart, baseEnd, cycle, finalSpan);
      const recurrence_id = cycle !== "None" ? crypto.randomUUID() : null;
      
      await prisma.event.createMany({
        data : occurrences.map(({ start_time, end_time}) => ({
          title,
          start_time: new Date(start_time),
          end_time: new Date(end_time),
          weight,
          cycle,
          span: finalSpan,
          schedule_id: sched,
          recurrence_id,
        })),
      });

      // Fetch the created events to get their IDs for Participates
      const createdEvents = await prisma.event.findMany({
        where: {
          schedule_id: sched,
          recurrence_id: recurrence_id ?? undefined,
          // For non-recurring, match by start_time
          ...(recurrence_id === null && { start_time: baseStart }),
        },
      });

      // Add user as participant for all occurrences
      await prisma.participates.createMany({
        data: createdEvents.map((e) => ({
          user_email: userEmail,
          event_id: e.event_id,
        })),
      });

      return res.status(201).json({ events: createdEvents });
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

// Route: GET /api/event/:schedule/?date=...&page=...&limit=...&timezone=...&search=...
router.get("/:schedule/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { schedule } = req.params;
    const { date } = req.query;
    const userEmail = authReq.user?.email;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const search = req.query.search as string || "";
    const timezone = parseInt(req.query.timezone as string) || 0;
    const offset = (page - 1) * limit;

    const whereClause: any = {
      OR: [
        { schedule_id: schedule },
        {
          participants: {
            some: {
              user_email: userEmail,
            }
          }
        }
      ]
    };

    console.log(`date: ${date}`);

    if (search) {
      whereClause.title = {
        contains: search,
      };
    }

    if (date) {
      const startOfDay = new Date(date as string);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const utcStart = new Date(startOfDay.getTime() + timezone * 60 * 1000);
      const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);

      console.log(utcStart);
      console.log(utcEnd);

      whereClause.start_time = {
        gte: utcStart,
        lte: utcEnd,
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
          start_time: 'asc',
        },
      }),
    ]);

    console.log(rows);

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

      whereClause.start_time = {
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
          start_time: 'asc',
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