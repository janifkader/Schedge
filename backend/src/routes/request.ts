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

// POST /api/request/
router.post(
  "/",
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { event_id, receiver, last_updated } = req.body;
      const userEmail = authReq.user?.email;

      if (!userEmail || !event_id || !receiver || !last_updated){
        return res.status(401).json({ error: "Missing information." });
      }

      const existingUser = await prisma.participates.findFirst({ where: { user_email: receiver } });
      if (existingUser) {
        return res.status(409).json({ error: "This user is already participating in this event." });
      }

      const request = await prisma.request.create({
        data : {
          sender_email: userEmail,
          event_id,
          receiver_email: receiver,
          status: "Pending",
          last_updated
        }
      });

      return res.status(201).json({ request });
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

// patch /api/request/:id/
router.patch(
  "/:id/",
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthRequest;
      const { id } = req.params as { id: string };
      const { status, last_updated } = req.body;
      const userEmail = authReq.user?.email;

      if (!userEmail || !status || !last_updated){
        return res.status(401).json({ error: "Missing information." });
      }

      if (status === 'Accepted') {
        const r = await prisma.request.findUnique({
          where : { request_id: id }
        })

        if (!r || !r.receiver_email || !r.event_id) {
          return res.status(400).json({ error: "A unique constraint failed on this account." });
        }

        await prisma.participates.create({
          data : {
            user_email: r.receiver_email,
            event_id: r.event_id,
          }
        })
      }

      const request = await prisma.request.update({
        where : { request_id: id },
        data : { status, last_updated }
      });

      return res.status(201).json({ request });
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

// Route: GET /api/request/?start=...&end=...&page=...&limit=...&filter=...
router.get("/", isAuthenticated as any, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const userEmail = authReq.user?.email;
    const { schedule } = req.params;
    const { start, end, filter } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 1000;
    const offset = (page - 1) * limit;

    const whereClause: any = { receiver_email: userEmail };

    if (start && end) {
      whereClause.date = { gte: new Date(start as string), lte: new Date(end as string) };
    } else if (start) {
      whereClause.date = { gte: new Date(start as string) };
    } else if (end) {
      whereClause.date = { lte: new Date(end as string) };
    }

    if (filter && filter !== "All") {
      whereClause.category = filter;
    }

    const [count, rows] = await prisma.$transaction([
      prisma.request.count({
        where: whereClause,
      }),

      prisma.request.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: {
          last_updated: 'asc',
        },
      }),
    ]);

    return res.status(200).json({
      requests: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

export default router;