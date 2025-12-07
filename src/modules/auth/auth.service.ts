import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../../config/db";
import config from "../../config";

const INVALID_CREDENTIALS_MSG = "Invalid email or password.";

const signup = async (Payload: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: "admin" | "customer";
}) => {
  const { name, email, password, phone, role = "customer" } = Payload;
  const lowerEmail = email.toLowerCase();

  const existsEmail = await pool.query(
    `SELECT id FROM users WHERE LOWER(email) = $1`,
    [lowerEmail]
  );

  if ((existsEmail.rowCount ?? 0) > 0) {
    return {
      status: 409,
      body: { success: false, message: "Email already exists" },
    };
  }

  const existsPhone = await pool.query(
    `SELECT id FROM users WHERE phone = $1`,
    [phone]
  );

  if ((existsPhone.rowCount ?? 0) > 0) {
    return {
      status: 409,
      body: { success: false, message: "Phone number already exists" },
    };
  }

  const hashPassword = await bcrypt.hash(password as string, 10);

  const result = await pool.query(
    `INSERT INTO users(name, email ,password, phone, role) VALUES($1, $2, $3, $4, $5) RETURNING *`,
    [name, lowerEmail, hashPassword, phone, role]
  );

  const newUser = result.rows[0];

  const safeUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
  };

  return { status: 201, body: { success: true, user: safeUser } };
};

const signin = async (email: string, password: string) => {
  const lowerEmail = email.toLowerCase();

  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    lowerEmail,
  ]);

  const invalidCredentialsError = new Error(INVALID_CREDENTIALS_MSG);

  if (result.rows.length === 0) {
    throw invalidCredentialsError;
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw invalidCredentialsError;
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwtSecret as string,
    {
      expiresIn: "1d",
    }
  );

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
  };

  return { token, user: safeUser };
};

export const authServices = {
  signup,
  signin,
};
