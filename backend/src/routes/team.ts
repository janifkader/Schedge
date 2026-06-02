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

    const team = await prisma.team.findUnique({ where: { team_id: id } });

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

export default router;