import { NextResponse } from "next/server";

export const runtime = "nodejs";

function buildLogoutResponse() {
  const response = NextResponse.json({ ok: true }, { status: 200 });

  response.cookies.set({
    name: "cp_session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function POST() {
  return buildLogoutResponse();
}

export async function GET() {
  return buildLogoutResponse();
}
