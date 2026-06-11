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

// POST /api/team/
router.post(
  "/",
  isAuthenticated as any,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const userEmail = authReq.user?.email;
      const { team_name, members } = req.body;
      if (!userEmail || !team_name || !members) {
        console.log(`userEmail: ${userEmail}, name: ${team_name}, members: ${members}`);
        return res.status(401).json({ error: "Missing information." });
      }
      const team = await prisma.team.create({
        data : {
          leader_email: userEmail,
          team_name,
        }
      });

      if (!team || !team.team_id) {
        return res.status(500).json({ error: "Internal Server Error during team creation." });
      }

      await prisma.membership.create({ 
          data : {
            user_email: userEmail,
            team_id: team.team_id
          }
        });

      members.forEach(async function (member: { email: string, name: string }) {
        await prisma.membership.create({ 
          data : {
            user_email: member.email,
            team_id: team.team_id
          }
        });
      });

      await prisma.teamSchedule.create({
        data : {
          owner_email: userEmail,
          team_id: team.team_id,
        }
      })


      return res.status(201).json({ team });
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

// Route: PUT /api/team/:id/
router.put("/:id/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params as { id: string };
    const { email } = req.body
    const userEmail = authReq.user?.email;

    if (!id || !email) {
      return res.status(401).json({ error: "Missing information." });
    }

    const team = await prisma.membership.create({
      data : {
        user_email: email,
        team_id: id,
      }
    });

    return res.status(200).json({
      team
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// Route: GET /api/team/:id
router.get("/:id/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { id } = req.params as { id: string };
    const userEmail = authReq.user?.email;

    const team = await prisma.team.findUnique({ 
      where: { team_id: id },
      include: {
          members: {
            include: {
              user: {
                include: {
                  schedule: true,
                }
              }
            }
          }
        }
    });

    return res.status(200).json({
      team
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

// Route: GET /api/team/
router.get("/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userEmail = authReq.user?.email;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = (page - 1) * limit;

    if (!userEmail) {
      return res.status(401).json({ error: "Missing information." });
    }

    const whereClause: any = {
      OR: [
        { leader_email: userEmail },
        {
          members: {
            some: {
              user_email: userEmail,
            }
          }
        }
      ]
    };

    const [count, rows] = await prisma.$transaction([
      prisma.team.count({
        where: whereClause,
      }),

      prisma.team.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          team_name: 'asc',
        },
        include: {
          members: {
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

    const formattedTeams = rows.map((team) => ({
      ...team,
      members: team.members.map((m) => m.user),
    }));

    return res.status(200).json({
      teams: formattedTeams,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// GET /api/team/:team_id/suggestions/?date=...&duration=...
router.get(
  "/:team_id/suggestions/",
  isAuthenticated as any,
  async (req: Request, res: Response) => {
    try {
      const { team_id } = req.params as { team_id: string };
      const { date, duration } = req.query;

      if (!date || !duration) {
        return res.status(400).json({ error: "Missing parameters." });
      }

      const durationMs = parseInt(duration as string) * 60 * 1000;
      const timezone = parseInt(req.query.timezone as string) || 0;

      const startOfDay = new Date(date as string);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      const workStart = new Date(startOfDay.getTime() + timezone * 60 * 1000 + 8 * 60 * 60 * 1000);
      const workEnd = new Date(startOfDay.getTime() + timezone * 60 * 1000 + 20 * 60 * 60 * 1000);

      // Get all team members and their schedules
      const team = await prisma.team.findUnique({
        where: { team_id },
        include: {
          members: {
            include: {
              user: {
                include: {
                  schedule: true,
                }
              }
            }
          }
        }
      });

      if (!team) return res.status(404).json({ error: "Team not found." });

      // Fetch each member's events for the day
      const memberEvents = await Promise.all(
        team.members.map(async (m) => {
          if (!m.user.schedule) return { email: m.user_email, name: m.user.name, events: [] };
          const events = await prisma.event.findMany({
            where: {
              schedule_id: m.user.schedule.sched_id,
              start_time: { gte: startOfDay, lt: endOfDay },
            },
            orderBy: { start_time: "asc" },
          });
          return {
            email: m.user_email,
            name: m.user.name,
            events: events.map((e) => ({
              event_id: e.event_id,
              title: e.title,
              start_time: e.start_time,
              end_time: e.end_time,
              weight: e.weight,
            })),
          };
        })
      );

      // Score each candidate slot
      const step = 30 * 60 * 1000;
      let cursor = workStart.getTime();
      const suggestions: {
        start_time: string;
        end_time: string;
        available_members: string[];
        busy_members: { name: string; conflict: string }[];
        disruption_score: number;
      }[] = [];

      while (cursor + durationMs <= workEnd.getTime()) {
        const slotEnd = cursor + durationMs;
        const availableMembers: string[] = [];
        const busyMembers: { name: string; conflict: string }[] = [];
        let totalDisruption = 0;

        for (const member of memberEvents) {
          const conflictingEvents = member.events.filter((e) => {
            return cursor < e.end_time.getTime() && slotEnd > e.start_time.getTime();
          });

          if (conflictingEvents.length === 0) {
            availableMembers.push(member.name);
          } else {
            // Calculate disruption — sum of weights of conflicting events
            const disruption = conflictingEvents.reduce((sum, e) => sum + e.weight, 0);
            totalDisruption += disruption;
            busyMembers.push({
              name: member.name,
              conflict: conflictingEvents.map((e) => e.title).join(", "),
            });
          }
        }

        suggestions.push({
          start_time: new Date(cursor).toISOString(),
          end_time: new Date(slotEnd).toISOString(),
          available_members: availableMembers,
          busy_members: busyMembers,
          disruption_score: totalDisruption,
        });

        cursor += step;
      }

      // Sort by most available members first, then least disruption
      suggestions.sort((a, b) => {
        const availDiff = b.available_members.length - a.available_members.length;
        if (availDiff !== 0) return availDiff;
        return a.disruption_score - b.disruption_score;
      });

      return res.status(200).json({
        suggestions: suggestions.slice(0, 5),
        total_members: team.members.length,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to generate team suggestions." });
    }
  }
);

export default router;