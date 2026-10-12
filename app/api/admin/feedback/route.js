import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const [[sum]] = await pool.query(
    `SELECT SUM(status = 'pending') AS pending,
            SUM(status = 'reviewed') AS reviewed,
            ROUND(AVG(rating), 1) AS avgRating
       FROM feedback`
  );
  const [items] = await pool.query(
    `SELECT f.id, f.category, f.rating, f.message, f.status, f.created_at, u.name, u.email
       FROM feedback f JOIN users u ON u.id = f.user_id
      ORDER BY f.status = 'pending' DESC, f.created_at DESC
      LIMIT 200`
  );
  return NextResponse.json({
    pending: Number(sum.pending || 0),
    reviewed: Number(sum.reviewed || 0),
    avgRating: sum.avgRating,
    items,
  });
}
