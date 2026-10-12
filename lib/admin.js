import { NextResponse } from "next/server";
// Replace this import with however your project reads the logged-in user
// (session cookie, JWT, etc.). It must return { id, role } or null.
import { getCurrentUser } from "@/lib/auth";

// Call at the top of every admin route:
//   const denied = await requireAdmin(req); if (denied) return denied;
export async function requireAdmin(req) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });
  return null;
}
