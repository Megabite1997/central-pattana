import { sql } from "@/lib/db";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const rows = await sql`SELECT 1 as ok`;
  const ok = Array.isArray(rows) && rows.length > 0 && (rows[0] as { ok?: number }).ok === 1;
  return NextResponse.json({ ok });
}
