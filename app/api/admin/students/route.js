import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";

  const where = ["u.role = 'student'"];
  const params = [];
  if (q) {
    where.push("(u.name LIKE ? OR u.email LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (["active", "suspended"].includes(status)) {
    where.push("u.status = ?");
    params.push(status);
  }

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.status, u.created_at,
            (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS courses_enrolled
       FROM users u
      WHERE ${where.join(" AND ")}
      ORDER BY u.created_at DESC
      LIMIT 100`,
    params
  );
  return NextResponse.json(rows);
}
