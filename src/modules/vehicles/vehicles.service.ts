import { pool } from "../../config/db";

const createVehicle = async (Payload: Record<string, unknown>) => {
  const {
    vehicle_name,
    type,
    registration_number,
    daily_rent_price,
    availability_status,
  } = Payload;

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
  const result = await pool.query(`DELETE FROM vehicles WHERE id = $1`, [id]);

  return result;
};

export const vehicleServices = {
  createVehicle,
  getAllVehicle,
  getSingleVehicle,
  updatedVehicle,
  deleteVehicle,
};
