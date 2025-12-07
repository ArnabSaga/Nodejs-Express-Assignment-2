import { pool } from "../../config/db";

const daysBetween = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffTime = end.getTime() - start.getTime();

  const msPerDay = 24 * 60 * 60 * 1000;

  const diffDays = Math.round(diffTime / msPerDay);

  return diffDays > 0 ? diffDays : 1;
};

const createBooking = async (Payload: {
  customer_id: string;
  vehicle_id: string;
  rent_start_date: string;
  rent_end_date: string;
}) => {
  const { customer_id, vehicle_id, rent_start_date, rent_end_date } = Payload;

  await pool.query("BEGIN");

  const user = await pool.query(`SELECT id FROM users WHERE id = $1`, [
    customer_id,
  ]);

  if (user.rowCount === 0) {
    await pool.query("ROLLBACK");

    return {
      status: 404,
      body: { success: false, message: "Customer not found" },
    };
  }

  const vehicleRes = await pool.query(
    `SELECT id, daily_rent_price, availability_status FROM vehicles WHERE id = $1 FOR UPDATE`,
    [vehicle_id]
  );

  if (vehicleRes.rowCount === 0) {
    await pool.query("ROLLBACK");

    return {
      status: 404,
      body: { success: false, message: "Vehicle not found" },
    };
  }

  const vehicle = vehicleRes.rows[0];

  if (vehicle.availability_status !== "available") {
    await pool.query("ROLLBACK");

    return {
      status: 404,
      body: { success: false, message: "Vehicle is not available" },
    };
  }

  const start = new Date(rent_start_date);
  const end = new Date(rent_end_date);

  const numDays = daysBetween(rent_start_date, rent_end_date);

  if (
    !(start instanceof Date) ||
    isNaN(start.getTime()) ||
    !(end instanceof Date) ||
    isNaN(end.getTime()) ||
    numDays <= 0
  ) {
    await pool.query("ROLLBACK");

    return {
      status: 400,
      body: {
        success: false,
        message: "Invalid rental duration or date format",
      },
    };
  }

  const total_price = Number(vehicle.daily_rent_price) * numDays;

  const insert = await pool.query(
    `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status) VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
    [customer_id, vehicle_id, rent_start_date, rent_end_date, total_price]
  );

  await pool.query(
    `UPDATE vehicles SET availability_status = 'booked' , updated_at = NOW() WHERE id = $1`,
    [vehicle_id]
  );

  await pool.query("COMMIT");

  const booking = insert.rows[0];

  booking.vehicle = {
    vehicle_name: null,
    daily_rent_price: vehicle.daily_rent_price,
  };

  const vehicleName = await pool.query(
    `SELECT vehicle_name FROM vehicles WHERE id = $1`,
    [vehicle_id]
  );

  if (vehicleName.rowCount! > 0)
    booking.vehicle.vehicle_name = vehicleName.rows[0].vehicle_name;

  return {
    status: 201,
    body: {
      success: true,
      message: "Booking created successfully",
      data: booking,
    },
  };
};

const getBooking = async (requestingUser: { id: string; role: string }) => {
  if (requestingUser.role === "admin") {
    const result = await pool.query(`
      SELECT b.*, u.name as customer_name, u.email as customer_email, v.vehicle_name, v.registration_number  
      FROM bookings b
      LEFT JOIN users u ON u.id = b.customer_id
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      ORDER BY b.id DESC
      `);

    return {
      status: 200,
      body: {
        success: true,
        message: "Bookings retrieved successfully",
        data: result.rows,
      },
    };
  } else {
    const result = await pool.query(
      `
      SELECT b.id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status, v.vehicle_name, v.registration_number, v.type
      FROM bookings b
      LEFT JOIN vehicles v ON v.id = b.vehicle_id
      WHERE b.customer_id = $1
      ORDER BY b.id DESC
      `,
      [requestingUser.id]
    );

    return {
      status: 200,
      body: {
        success: true,
        message: "Your bookings retrieved successfully",
        data: result.rows,
      },
    };
  }
};

const updateBooking = async (
  requestingUser: { id: string; role: string },
  bookingId: string,
  update: { status?: string }
) => {
  await pool.query("BEGIN");

  const b = await pool.query(
    `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
    [bookingId]
  );

  if (b.rowCount === 0) {
    await pool.query("ROLLBACK");

    return {
      status: 404,
      body: {
        success: false,
        message: "Booking not found",
      },
    };
  }

  const booking = b.rows[0];

  if (update.status === "cancelled") {
    if (
      requestingUser.role !== "admin" &&
      requestingUser.id !== booking.customer_id
    ) {
      await pool.query("ROLLBACK");

      return {
        status: 403,
        body: {
          success: false,
          message: "Forbidden",
        },
      };
    }

    if (booking.status === "cancelled" || booking.status === "returned") {
      await pool.query("ROLLBACK");

      return {
        status: 400,
        body: {
          success: false,
          message:
            "Cannot cancel a booking that is already cancelled or returned",
        },
      };
    }

    const now = new Date();
    const start = new Date(booking.rent_start_date);

    if (now.getTime() >= start.getTime()) {
      await pool.query("ROLLBACK");

      return {
        status: 400,
        body: {
          success: false,
          message: "Cannot cancel booking on or after start date",
        },
      };
    }

    await pool.query(
      `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );

    await pool.query(
      `UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`,
      [booking.vehicle_id]
    );

    await pool.query("COMMIT");

    const updated = await pool.query(
      `SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE id = $1`,
      [bookingId]
    );
    return {
      status: 200,
      body: {
        success: true,
        message: "Booking cancelled successfully",
        data: updated.rows[0],
      },
    };
  }

  if (update.status === "returned") {
    if (requestingUser.role !== "admin") {
      await pool.query("ROLLBACK");

      return {
        status: 403,
        body: {
          success: false,
          message: "Forbidden",
        },
      };
    }

    if (booking.status !== "active") {
      await pool.query("ROLLBACK");

      return {
        status: 400,
        body: {
          success: false,
          message: "Only 'active' bookings can be marked as 'returned'",
        },
      };
    }

    await pool.query(
      `UPDATE bookings SET status = 'returned', updated_at = NOW() WHERE id = $1`,
      [bookingId]
    );

    await pool.query(
      `UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`,
      [booking.vehicle_id]
    );

    await pool.query("COMMIT");

    const updated = await pool.query(
      `SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE id = $1`,
      [bookingId]
    );

    const vehicle = { availability_status: "available" };

    return {
      status: 200,
      body: {
        success: true,
        message: "Booking marked as returned. Vehicle is now available",
        data: { ...updated.rows[0], vehicle },
      },
    };
  }

  await pool.query("ROLLBACK");
  return {
    status: 400,
    body: {
      success: false,
      message: "Invalid status update provided.",
    },
  };
};

export const bookingServices = {
  createBooking,
  getBooking,
  updateBooking,
};
