import { Request, Response } from "express";

import { bookingServices } from "./booking.service";

import { AuthRequest } from "../../middleware/authMiddleware";

const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { customer_id, vehicle_id, rent_start_date, rent_end_date } =
      req.body;

    if (!customer_id || !vehicle_id || !rent_start_date || !rent_end_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (req.user.role !== "admin" && req.user.id !== String(customer_id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const result = await bookingServices.createBooking({
      customer_id: String(customer_id),
      vehicle_id: String(vehicle_id),
      rent_start_date,
      rent_end_date,
    });

    return res.status(result.status).json(result.body);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getBookings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await bookingServices.getBooking({
      id: req.user.id,
      role: req.user.role,
    });

    return res.status(result.status).json(result.body);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateBooking = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const bookingId = String(req.params.bookingId);

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const result = await bookingServices.updateBooking(
      {
        id: req.user.id,
        role: req.user.role,
      },
      bookingId,
      { status }
    );

    return res.status(result!.status).json(result?.body);
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const bookingControllers = {
  createBooking,
  getBookings,
  updateBooking,
};
