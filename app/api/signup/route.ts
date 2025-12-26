import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { setSessionCookie } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const signupBodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

function deriveNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.trim();
  return localPart && localPart.length > 0 ? localPart : "User";
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") return false;
  return (error as { code?: string }).code === "23505";
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = signupBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Please provide a valid email and password." },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const passwordHash = await hashPassword(parsed.data.password);
  const name = deriveNameFromEmail(email);

  try {
    const rows = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      RETURNING id;
    `;

    const id = Array.isArray(rows) && rows.length > 0 ? (rows[0] as { id?: string | number }).id : null;

    const response = NextResponse.json({ ok: true, id, email }, { status: 201 });
    if (id) {
      setSessionCookie(response.cookies, { userId: id, email, remember: true });
    }
    return response;
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ message: "Email already in use." }, { status: 409 });
    }

    console.error("Signup error", error);
    return NextResponse.json(
      { message: "Unable to create account." },
      { status: 500 }
    );
  }
}
