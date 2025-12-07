import express, { Request, Response } from "express";

import initDB, { pool } from "./config/db";

import { userRoutes } from "./modules/user/user.route";
import { authRoutes } from "./modules/auth/auth.route";
import { vehiclesRouter } from "./modules/vehicle/vehicle.route";
import { bookingsRouter } from "./modules/booking/booking.route";

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
app.use("/api/v1/vehicles", vehiclesRouter);

//* Bookings CRUD
app.use("/api/v1/bookings", bookingsRouter);

//! Not found routes
app.use(errorHandler);

export default app;
