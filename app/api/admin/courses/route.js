import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const [rows] = await pool.query("SELECT id, title FROM courses ORDER BY title");
  return NextResponse.json(rows);
}
