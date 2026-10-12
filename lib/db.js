import mysql from "mysql2/promise";

const g = globalThis;
export const pool =
  g.__pool ??
  (g.__pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  }));
