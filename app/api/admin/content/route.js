import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = {
  PDF: [".pdf"],
  Video: [".mp4", ".webm"],
  Quiz: [".json", ".csv", ".pdf"],
};

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type") || "";
  const course = searchParams.get("course") || "";

  const where = ["1=1"];
  const params = [];
  if (q) { where.push("ci.title LIKE ?"); params.push(`%${q}%`); }
  if (ALLOWED[type]) { where.push("ci.type = ?"); params.push(type); }
  if (course) { where.push("ci.course_id = ?"); params.push(course); }

  const [rows] = await pool.query(
    `SELECT ci.id, ci.title, ci.type, ci.status, ci.file_path, ci.created_at, c.title AS course
       FROM content_items ci LEFT JOIN courses c ON c.id = ci.course_id
      WHERE ${where.join(" AND ")}
      ORDER BY ci.created_at DESC
      LIMIT 100`,
    params
  );
  return NextResponse.json(rows);
}

// multipart/form-data: title, description, type, course_id, file
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const form = await req.formData();
  const title = String(form.get("title") || "").trim();
  const description = String(form.get("description") || "").trim();
  const type = String(form.get("type") || "");
  const courseId = form.get("course_id") || null;
  const file = form.get("file");

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!ALLOWED[type]) return NextResponse.json({ error: "Choose PDF, Video or Quiz" }, { status: 400 });
  if (!file || typeof file === "string" || !file.size)
    return NextResponse.json({ error: "Attach a file" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File is larger than 25 MB" }, { status: 400 });

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED[type].includes(ext))
    return NextResponse.json({ error: `A ${type} must be ${ALLOWED[type].join(", ")}` }, { status: 400 });

  const safeName = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));

  const [r] = await pool.query(
    "INSERT INTO content_items (course_id, title, description, type, file_path) VALUES (?, ?, ?, ?, ?)",
    [courseId, title, description || null, type, `/uploads/${safeName}`]
  );
  return NextResponse.json({ ok: true, id: r.insertId }, { status: 201 });
}
