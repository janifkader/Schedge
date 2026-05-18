import express from "express";
import passport from "passport";
import { generateAuthCookies } from "../routes/auth";

const router = express.Router();

router.get("/test", (req, res) => {
  res.send("The Google Router is successfully connected!");
});

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND}/login`,
  }),
  (req, res) => {
    const user = req.user as any;

    const { cookies } = generateAuthCookies(user.email);
    res.setHeader("Set-Cookie", cookies);

    res.redirect(`${process.env.FRONTEND}/dashboard`);
  },
);

export default router;
