import express, { Request, Response } from "express";

import initDB, { pool } from "./config/db";

import { userRoutes } from "./modules/users/user.route";
import { authRoutes } from "./modules/auth/auth.route";

import { errorHandler } from "./middleware/errorHandler";

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
app.use(errorHandler);

export default app;
