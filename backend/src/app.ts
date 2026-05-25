import express, { Request, Response, NextFunction } from "express";
import schedRoutes from "./routes/schedule";
import authRoutes from "./routes/auth";
import reqRoutes from "./routes/request";
import teamRoutes from "./routes/team";
import eventRoutes from "./routes/event";
import googleAuthRoutes from "./routes/googleAuth";
import cookieParser from "cookie-parser";
import passport from "passport";
import cors from "cors";

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://schedge-frontend.bravegrass-308b42ec.australiaeast.azurecontainerapps.io/signup",
  ],
  credentials: true,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("HTTP request", req.method, req.url, req.body);
  next();
});

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});

app.set("trust proxy", 1);

// Routes
app.use("/api", authRoutes);
app.use("/api/schedule", schedRoutes);
app.use("/api/request", reqRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/event", eventRoutes);

app.get("/api/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

export default app;