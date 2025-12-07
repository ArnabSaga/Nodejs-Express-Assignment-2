import { pool } from "../../config/db";

const createVehicle = async (Payload: Record<string, unknown>) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = Payload;

  const allowedTypes = ["car", "bike", "van", "SUV"];

  if (!vehicle_name || !registration_number) {
    throw new Error(
      "Validation: vehicle_name and registration_number are required"
    );
  }

  if (type && !allowedTypes.includes(String(type))) {
    throw new Error("Validation: invalid vehicle type");
  }

  if (
    daily_rent_price === undefined ||
    Number.isNaN(Number(daily_rent_price)) ||
    Number(daily_rent_price) <= 0
  ) {
    throw new Error("Validation: daily_rent_price must be a positive number");
  }

  const result = await pool.query(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status) VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [
      vehicle_name,
      type,
      registration_number,
      daily_rent_price,
      availability_status,
    ]
  );

  return result;
};

const getAllVehicle = async () => {
  const result = await pool.query(`SELECT * FROM vehicles`);

  return result;
};

const getSingleVehicle = async (id: string) => {
  const result = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);

  return result;
};

const updatedVehicle = async (Payload: Record<string, unknown>, id: string) => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;

  const allowedFields = [
    "vehicle_name",
    "type",
    "registration_number",
    "daily_rent_price",
    "availability_status",
  ];

  const allowedTypes = ["car", "bike", "van", "SUV"];

  if (
    Payload["type"] !== undefined &&
    !allowedTypes.includes(String(Payload["type"]))
  ) {
    throw new Error("Validation: invalid vehicle type");
  }

  if (Payload["daily_rent_price"] !== undefined) {
    const p = Number(Payload["daily_rent_price"]);
    if (Number.isNaN(p) || p <= 0) {
      throw new Error("Validation: daily_rent_price must be a positive number");
    }
  }

  if (
    Payload["vehicle_name"] !== undefined &&
    String(Payload["vehicle_name"]).trim() === ""
  ) {
    throw new Error("Validation: vehicle_name cannot be empty");
  }

  if (
    Payload["registration_number"] !== undefined &&
    String(Payload["registration_number"]).trim() === ""
  ) {
    throw new Error("Validation: registration_number cannot be empty");
  }

  for (const field of allowedFields) {
    if (Payload[field] !== undefined) {
      fields.push(`${field} = $${paramCount}`);
      values.push(Payload[field]);
      paramCount++;
    }
  }

  if (fields.length === 0) {
    throw new Error("No fields provided for update.");
  }

  values.push(id);
  const whereClauseParam = paramCount;

  const query = `
    UPDATE vehicles
    SET ${fields.join(", ")}
    WHERE id = $${whereClauseParam}
    RETURNING *;
  `;

  const result = await pool.query(query, values);

  return result;
};

const deleteVehicle = async (id: string) => {
  const activeBookings = await pool.query(
    `SELECT COUNT(*) FROM bookings WHERE vehicle_id=$1 AND status = 'active'`,
    [id]
  );

  if (parseInt(activeBookings.rows[0].count) > 0) {
    return {
      status: 409,
      body: {
        success: false,
        message: "Vehicle has active bookings and cannot be deleted.",
      },
    };
  }

  const result = await pool.query(
    `DELETE FROM vehicles WHERE id = $1 RETURNING id`,
    [id]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      body: { success: false, message: "Vehicle not found" },
    };
  }

  return result;
};

export const vehicleServices = {
  createVehicle,
  getAllVehicle,
  getSingleVehicle,
  updatedVehicle,
  deleteVehicle,
};
