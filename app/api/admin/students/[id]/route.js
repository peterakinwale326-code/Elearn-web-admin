import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// PATCH { status: "active" | "suspended" }
export async function PATCH(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const { status } = await req.json();
  if (!["active", "suspended"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const [r] = await pool.query(
    "UPDATE users SET status = ? WHERE id = ? AND role = 'student'",
    [status, id]
  );
  if (!r.affectedRows) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
