import { Pool } from "pg";

import config from ".";

export const pool = new Pool({
  connectionString: `${config.connectionString}`,
});

const initDB = async () => {
  const safeEnum = async (query: string) => {
    try {
      await pool.query(query);
    } catch (err: any) {
      if (!err.message.includes("already exists")) {
        console.log(err.message);
      }
    }
  };

  await safeEnum(`CREATE TYPE user_role AS ENUM ('customer', 'admin')`);
  await safeEnum(
    `CREATE TYPE type_vehicle AS ENUM ('car', 'bike', 'van', 'SUV')`
  );
  await safeEnum(
    `CREATE TYPE vehicles_availability_status AS ENUM ('available', 'booked')`
  );
  await safeEnum(
    `CREATE TYPE booking_status AS ENUM ('active', 'cancelled', 'returned')`
  );

  //* user table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200) NOT NULL,
      password TEXT NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      role user_role NOT NULL DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  //? case-insensitive email
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx
      ON users (LOWER(email));
    `);

  //* vehicles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicles(
      id SERIAL PRIMARY KEY,
      vehicle_name VARCHAR(200) NOT NULL,
      type type_vehicle NOT NULL DEFAULT 'car',
      registration_number VARCHAR(50) NOT NULL UNIQUE,
      daily_rent_price NUMERIC(10, 2) NOT NULL,
      availability_status vehicles_availability_status NOT NULL DEFAULT 'available',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  //* bookings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings(
      id SERIAL PRIMARY KEY,
      customer_id INT REFERENCES users(id) ON DELETE CASCADE,
      vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE,
      rent_start_date DATE NOT NULL,
      rent_end_date DATE NOT NULL,
      total_price NUMERIC(10,2) NOT NULL,
      status booking_status NOT NULL DEFAULT 'active',
      CONSTRAINT check_end_after_start CHECK (rent_end_date > rent_start_date),
      CONSTRAINT check_positive_price CHECK (total_price > 0),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

export default initDB;
