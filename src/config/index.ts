import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), "./src/.env") });

const config = {
  connectionString: process.env.DB_CONNECTION_STRING,
  port: process.env.PORT,
};


export default config;
