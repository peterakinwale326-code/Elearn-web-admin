import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function DELETE(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;
  const [[row]] = await pool.query("SELECT file_path FROM content_items WHERE id = ?", [id]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await pool.query("DELETE FROM content_items WHERE id = ?", [id]);
  const file = path.join(process.cwd(), "public", "uploads", path.basename(row.file_path));
  await unlink(file).catch(() => {});
  return NextResponse.json({ ok: true });
}
