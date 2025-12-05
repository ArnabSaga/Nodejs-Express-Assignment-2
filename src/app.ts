import express, { Request, Response } from "express";

import initDB from "./config/db";

const app = express();

//* Parse
app.use(express.json());

//* initializing DB
initDB();

//* Root route
app.get("/", (req: Request, res: Response) => {
  res.send("Vehicle Rental System");
});

//* User CRUD

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
