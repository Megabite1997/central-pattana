import { clearSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function buildLogoutResponse() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  clearSessionCookie(response.cookies);

  return response;
}

export async function POST() {
  return buildLogoutResponse();
}

export async function GET() {
  return buildLogoutResponse();
}
