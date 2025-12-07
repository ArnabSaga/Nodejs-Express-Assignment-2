import express from "express";

import { authenticate } from "../../middleware/authMiddleware";
import { bookingControllers } from "./booking.controller";

const router = express.Router();

//* create booking CRUD
router.post("/", authenticate, bookingControllers.createBooking);

//* get booking CRUD
router.get("/", authenticate, bookingControllers.getBookings);

//* update booking CRUD
router.put("/:bookingId", authenticate, bookingControllers.updateBooking);

export const bookingsRouter = router;
