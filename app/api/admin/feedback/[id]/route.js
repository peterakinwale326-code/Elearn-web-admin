import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// PATCH marks the feedback as reviewed
export async function PATCH(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await params;
  await pool.query("UPDATE feedback SET status = 'reviewed' WHERE id = ?", [id]);
  return NextResponse.json({ ok: true });
}
