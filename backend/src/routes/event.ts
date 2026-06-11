import express, { Request, Response } from "express";
import { genSalt, hash, compare } from "bcrypt";
import { serialize } from "cookie";
import { getConflicts, getHigherWeightConflicts, getExistingEvents, weightedIntervalSchedule, EventInterval } from "../utils/scheduling";
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
      const { title, start_time, end_time, weight, cycle, span, forceCreate } = req.body;
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

      if (conflicts.length > 0 && !forceCreate) {
        const allEvents = existing.map((e) => ({
          event_id: e.event_id,
          title: e.title,
          start_time: e.start_time,
          end_time: e.end_time,
          weight: e.weight,
        }));
        const newEvent = { event_id: "new", title, start_time: baseStart, end_time: baseEnd, weight };
        const currentOptimal = weightedIntervalSchedule(allEvents);
        const currentScore = currentOptimal.reduce((sum, e) => sum + e.weight, 0);
        const resolutions = conflicts.map((conflict: EventInterval) => {
          const noConflict = [ ...allEvents.filter((e) => e.event_id != conflict.event_id), newEvent];
          const newOptimal = weightedIntervalSchedule(noConflict);
          const newScore = newOptimal.reduce((sum, e) => sum + e.weight, 0);
          return { event_id: conflict.event_id, title: conflict.title, weight: conflict.weight, preScore: currentScore, postScore: newScore, change: newScore - currentScore };
        });

        resolutions.sort((a,b) => b.change = a.change);
        return res.status(409).json({
          error: "Conflicts with higher or equal weight events.",
          conflicts: conflicts.map((c) => ({
            event_id: c.event_id,
            title: c.title,
            start_time: c.start_time,
            end_time: c.end_time,
            weight: c.weight,
          })),
          warning: true,
          resolutions
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

// PATCH /api/event/:schedule/
router.patch(
  "/:sched/:event_id/",
  isAuthenticated as any,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { sched, event_id } = req.params as { sched: string; event_id: string };
      const { title, start_time, end_time, weight, cycle, span, applyToAll } = req.body;
      const userEmail = authReq.user?.email;
      if (!userEmail || !title || !start_time || !end_time || !weight || !cycle || !span || !sched) {
        //console.log(`email: ${userEmail}, title: ${title}, date: ${date}, weight: ${weight}, cycle: ${cycle}, span: ${span}, sched: ${sched}`);
        return res.status(401).json({ error: "Missing information." });
      }
      const existing = await prisma.event.findUnique({
        where: { event_id },
      });
      if (!existing) {
        return res.status(404).json({ error: "Event not found." });
      }

      if (existing.schedule_id !== sched) {
        return res.status(403).json({ error: "Unauthorized." });
      }

      const baseStart = new Date(start_time.includes('Z') || start_time.includes('+') ? start_time : start_time + 'Z');
      const baseEnd = new Date(end_time.includes('Z') || end_time.includes('+') ? end_time : end_time + 'Z');

      if (applyToAll && existing.recurrence_id) {
        // Update all future occurrences — only non-time fields since each has its own time
        await prisma.event.updateMany({
          where: {
            recurrence_id: existing.recurrence_id,
            start_time: { gte: existing.start_time }, // from this event onwards
          },
          data: {
            title,
            weight,
            cycle,
            span,
          },
        });

        // Update time fields only on this specific event
        await prisma.event.update({
          where: { event_id },
          data: {
            start_time: baseStart,
            end_time: baseEnd,
          },
        });
      } else {
        // Update only this event
        await prisma.event.update({
          where: { event_id },
          data: {
            title,
            start_time: baseStart,
            end_time: baseEnd,
            weight,
            cycle,
            span,
          },
        });
      }

      const updated = await prisma.event.findUnique({ where: { event_id } });
      return res.status(200).json({ event: updated });
    } catch (error: any) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return res.status(400).json({ error: "A unique constraint failed." });
        }
      }
      return res.status(500).json({ error: "Internal Server Error" });
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
        mode: "insensitive",
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
        include: {
          participants: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                  avatar_url: true,
                }
              }
            }
          }
        }
      }),
    ]);

    console.log(rows);

    const optimalSet = weightedIntervalSchedule(
      rows.map((e) => ({
        event_id: e.event_id,
        title: e.title,
        start_time: e.start_time,
        end_time: e.end_time,
        weight: e.weight,
      }))
    );

    const optimalIds = new Set(optimalSet.map((e) => e.event_id));

    const eventsWithOptimal = rows.map((e) => {
      const owner = e.participants.find((p) => p.user_email === userEmail)
        ?? e.participants[0];

      return {
        ...e,
        isOptimal: optimalIds.has(e.event_id),
        owner: owner ? {
          email: owner.user?.email,
          name: owner.user?.name,
          avatar_url: owner.user?.avatar_url,
        } : null,
        isShared: e.schedule_id !== schedule, // true if event came from a participant, not the schedule
      };
    });

    return res.status(200).json({
      events: eventsWithOptimal,
      total: count,
      totalPages: Math.ceil(count / limit),
      optimalScore: optimalSet.reduce((sum, e) => sum + e.weight, 0),
      totalScore: rows.reduce((sum, e) => sum + e.weight, 0),
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
    return res.status(500).json({ error: "Failed to fetch participants" });
  }
});

//Route: DELETE /api/event/:event_id/
router.delete("/:event_id/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { event_id } = req.params as { event_id: string };

    await prisma.$transaction([
      prisma.participates.deleteMany({ where: { event_id } }),
      prisma.request.deleteMany({ where: { event_id } }),
    ]);

    const ev = await prisma.event.delete({
      where: {
        event_id,
      },
    });

    return res.status(200).json({ event: ev });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to delete event" });
  }
});

// GET /api/event/:sched/suggestions/?date=...&duration=...&weight=...
router.get(
  "/:sched/suggestions/",
  isAuthenticated as any,
  async (req: Request, res: Response) => {
    try {
      const { sched } = req.params as { sched: string };
      const { date, duration, weight } = req.query;

      if (!date || !duration || !weight) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      const durationMs = parseInt(duration as string) * 60 * 1000;
      const baseWeight = parseInt(weight as string);

      const startOfDay = new Date(date as string);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const existingEvents = await prisma.event.findMany({
        where: {
          schedule_id: sched,
          start_time: { gte: startOfDay, lt: endOfDay },
        },
        orderBy: { start_time: "asc" },
      });

      const timezone = parseInt(req.query.timezone as string) || 0;
      const workStart = new Date(startOfDay.getTime() + timezone * 60 * 1000 + 8 * 60 * 60 * 1000);
      const workEnd = new Date(startOfDay.getTime() + timezone * 60 * 1000 + 20 * 60 * 60 * 1000);

      const step = 30 * 60 * 1000;
      let cursor = workStart.getTime();
      let slotId = 0;

      type Slot = {
        id: number;
        start: number;
        end: number;
        weight: number;
        isoStart: string;
        isoEnd: string;
      };

      const freeSlots: Slot[] = [];

      while (cursor + durationMs <= workEnd.getTime()) {
        const currentEnd = cursor + durationMs;

        const conflict = existingEvents.some((event) => {
          const evStart = event.start_time.getTime();
          const evEnd = event.end_time.getTime();
          return cursor < evEnd && currentEnd > evStart;
        });

        if (!conflict) {
          const target = new Date(cursor);
          const hour = target.getUTCHours();

          let modifier = 1.0;
          if (hour >= 9 && hour <= 12) modifier = 1.3;
          if (hour >= 13 && hour <= 14) modifier = 0.8;

          freeSlots.push({
            id: slotId++,
            start: cursor,
            end: currentEnd,
            weight: Math.round(baseWeight * modifier),
            isoStart: new Date(cursor).toISOString(),
            isoEnd: new Date(currentEnd).toISOString(),
          });
        }
        cursor += step;
      }

      if (freeSlots.length === 0) {
        return res.status(200).json({ suggestions: [], message: "No slots found." });
      }

      freeSlots.sort((x, y) => x.end - y.end);
      const n = freeSlots.length;

      const p: number[] = new Array(n).fill(-1);
      for (let i = 0; i < n; i++) {
        for (let j = i - 1; j >= 0; j--) {
          if (freeSlots[j].end <= freeSlots[i].start) {
            p[i] = j;
            break;
          }
        }
      }

      const M: number[] = new Array(n + 1).fill(0);
      for (let i = 1; i <= n; i++) {
        const curWeight = freeSlots[i - 1].weight;
        const prevIdx = p[i - 1];
        const incWeight = curWeight + (prevIdx !== -1 ? M[prevIdx + 1] : 0);
        const exWeight = M[i - 1];
        M[i] = Math.max(incWeight, exWeight);
      }

      const candidates: Slot[] = [];
      let i = n;
      while (i > 0) {
        const curWeight = freeSlots[i - 1].weight;
        const prevIdx = p[i - 1];
        const incWeight = curWeight + (prevIdx !== -1 ? M[prevIdx + 1] : 0);
        const exWeight = M[i - 1];

        if (incWeight >= exWeight) {
          candidates.push(freeSlots[i - 1]);
          i = prevIdx !== -1 ? prevIdx + 1 : 0;
        } else {
          i--;
        }
      }

      candidates.reverse();

      const suggestions = candidates.slice(0, 3).map((slot) => ({
        start_time: slot.isoStart,
        end_time: slot.isoEnd,
        score_weight: slot.weight,
        slot_duration: parseInt(duration as string),
      }));

      return res.status(200).json({ suggestions });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to generate suggestions." });
    }
  }
);

export default router;