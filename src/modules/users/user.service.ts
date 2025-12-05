import bcrypt from "bcryptjs";

import { pool } from "../../config/db";

const createUser = async (Payload: Record<string, unknown>) => {
  const { name, email, password, phone, role } = Payload;

  const hashPassword = await bcrypt.hash(password as string, 10);

  const result = await pool.query(
    `INSERT INTO users(name, email ,password, phone, role) VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, hashPassword, phone, role]
  );

  return result;
};

const getAllUser = async () => {
  const result = await pool.query(`SELECT * FROM users`);

  return result;
};

const getSingleUser = async (id: string) => {
  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);

  return result;
};

const updateUser = async (
  name: string,
  email: string,
  phone: number,
  id: string
) => {
  const result = await pool.query(
    `
    UPDATE users SET name=$1, email=$2, phone=$3 WHERE id=$4 RETURNING *`,
    [name, email, phone, id]
  );

  return result;
};

const deleteUser = async (id: string) => {
  const result = await pool.query(`DELETE FROM users WHERE id=$1`, [id]);

  return result;
};

export const userServices = {
  createUser,
  getAllUser,
  getSingleUser,
  updateUser,
  deleteUser,
};
