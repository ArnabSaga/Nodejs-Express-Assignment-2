import express, { Request, Response } from "express";

import initDB, { pool } from "./config/db";

import { userRoutes } from "./modules/users/user.route";
import { authRoutes } from "./modules/auth/auth.route";

const app = express();

//* Parse
app.use(express.json());

//* initializing DB
initDB();

//* Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Vehicle Rental System");
});

//* Auth CRUD
app.use("/api/v1/auth", authRoutes);

//* User CRUD
app.use("/api/v1/users", userRoutes);

//* Vehicles CRUD

//* Bookings CRUD

//! Not found routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

export default app;
