import express from "express";
import { authControllers } from "./auth.controller";

const router = express.Router();

router.post("/signup", authControllers.signup);

router.post("/signin", authControllers.signin);

export const authRoutes = router;
