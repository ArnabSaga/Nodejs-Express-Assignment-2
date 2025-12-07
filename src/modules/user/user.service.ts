import { pool } from "../../config/db";
import bcrypt from "bcryptjs";

const getAllUser = async () => {
  const result = await pool.query(
    `SELECT id, name, email, phone, role FROM users`
  );

  return result;
};

const updateUser = async (Payload: {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  password?: string;
  id: string;
}) => {
  const { id, name, email, phone, role, password } = Payload;

  let queryFields: string[] = [];
  let queryValues: (string | number)[] = [];
  let counter = 1;

  if (name) queryFields.push(`name=$${counter++}`);
  if (email) queryFields.push(`email=$${counter++}`);
  if (phone) queryFields.push(`phone=$${counter++}`);
  if (role) queryFields.push(`role=$${counter++}`);
  if (password) queryFields.push(`password=$${counter++}`);

  if (queryFields.length === 0) {
    return pool.query(
      `SELECT id, name, email, phone, role FROM users WHERE id=$1`,
      [id]
    );
  }

  if (name) queryValues.push(name);
  if (email) queryValues.push(String(email).toLowerCase());
  if (phone) queryValues.push(phone);
  if (role) queryValues.push(role);
  if (password) {
    const hashed = await bcrypt.hash(password as string, 10);
    queryValues.push(hashed);
  }

  queryValues.push(id);

  const query = `UPDATE users SET ${queryFields.join(
    ", "
  )} WHERE id=$${counter}`;

  const result = await pool.query(query, queryValues);

  return result;
};

const deleteUser = async (id: string) => {
  const activeBookings = await pool.query(
    `SELECT COUNT(*) FROM bookings WHERE customer_id=$1 AND status = 'active'`,
    [id]
  );

  if (parseInt(activeBookings.rows[0].count) > 0) {
    return {
      status: 409,
      body: {
        success: false,
        message: "User has active bookings and cannot be deleted.",
      },
    };
  }

  const result = await pool.query(
    `DELETE FROM users WHERE id=$1 RETURNING id`,
    [id]
  );

  if (result.rowCount === 0) {
    return {
      status: 404,
      body: { success: false, message: "User not found" },
    };
  }

  return result;
};

export const userServices = {
  getAllUser,
  updateUser,
  deleteUser,
};
