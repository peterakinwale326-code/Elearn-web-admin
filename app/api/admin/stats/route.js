import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const [[students]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'student'");
  const [[courses]] = await pool.query("SELECT COUNT(*) AS n FROM courses");
  const [[pending]] = await pool.query("SELECT COUNT(*) AS n FROM feedback WHERE status = 'pending'");

  return NextResponse.json({
    totalStudents: students.n,
    activeCourses: courses.n,
    pendingFeedback: pending.n,
  });
}
