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
    "https://schedge-frontend.bravegrass-308b42ec.australiaeast.azurecontainerapps.io",
    "https://schedge.dev",
    "https://www.schedge.dev",
  ],
  credentials: true,
}));

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log("HTTP request", req.method, req.url, req.body);
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