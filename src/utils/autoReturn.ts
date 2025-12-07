import { pool } from "../config/db";

export const runAutoReturnSweep = async () => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; 

    const res = await pool.query(
      `SELECT id, vehicle_id FROM bookings WHERE status = 'active' AND rent_end_date < $1`,
      [todayStr]
    );

    if (res.rowCount === 0) return;

    const bookings = res.rows;

    await pool.query("BEGIN");

    for (const b of bookings) {
      await pool.query(
        `UPDATE bookings SET status = 'returned', updated_at = NOW() WHERE id = $1`,
        [b.id]
      );
      await pool.query(
        `UPDATE vehicles SET availability_status = 'available', updated_at = NOW() WHERE id = $1`,
        [b.vehicle_id]
      );
    }

    await pool.query("COMMIT");
  } catch (err: any) {
    try {
      await pool.query("ROLLBACK");
    } catch (e) {}
    console.error("Auto-return sweep failed:", err.message || err);
  }
};

export const scheduleAutoReturnSweep = () => {
  runAutoReturnSweep();

  const oneHourMs = 1000 * 60 * 60;
  setInterval(runAutoReturnSweep, oneHourMs);
};
