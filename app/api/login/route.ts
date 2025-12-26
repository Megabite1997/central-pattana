import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = loginBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please provide a valid email and password." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;
  const remember = parsed.data.remember ?? true;

  const rows = await sql`
    SELECT id, password_hash
    FROM users
    WHERE email = ${email}
    LIMIT 1;
  `;

  const user = Array.isArray(rows)
    ? (rows[0] as { id?: string | number; password_hash?: string | null } | undefined)
    : undefined;

  if (!user?.id || !user.password_hash) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });

  const authSecret = process.env.AUTH_SECRET;
  if (authSecret) {
    const token = createSessionToken({ sub: String(user.id), email, iat: Date.now() }, authSecret);

    response.cookies.set({
      name: "cp_session",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : null),
    });
  }

  return response;
}
