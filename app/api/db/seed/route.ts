import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getPositiveInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

export async function GET(request: Request) {
  const seedSecret = process.env.SEED_SECRET;
  if (!seedSecret) {
    return NextResponse.json(
      { ok: false, error: "Missing SEED_SECRET env var" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const secretFromHeader = request.headers.get("x-seed-secret");
  const secretFromQuery = url.searchParams.get("secret");
  const secret = secretFromHeader ?? secretFromQuery;

  if (secret !== seedSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const rowsToInsert = getPositiveInt(url.searchParams.get("rows"), 20);
  const reset = url.searchParams.get("reset") === "1";
  const plaintextPassword = process.env.SEED_USER_PASSWORD ?? "Password123!";

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`;

  if (reset) {
    await sql`DELETE FROM users;`;
  }

  const firstNames = [
    "Aom",
    "Bank",
    "Beam",
    "Fai",
    "Film",
    "Gift",
    "Ice",
    "June",
    "May",
    "Mint",
    "Nok",
    "Oat",
    "Ploy",
    "Pond",
    "Pream",
    "Tae",
    "Tee",
    "Ton",
  ];
  const lastNames = [
    "Somsri",
    "Sukjai",
    "Srisuk",
    "Jaidee",
    "Chaiyaporn",
    "Kittisak",
    "Wattanakul",
    "Boonsri",
  ];

  let inserted = 0;
  const createdEmails: string[] = [];
  for (let i = 0; i < rowsToInsert; i++) {
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i + 3) % lastNames.length];
    const email = `${first.toLowerCase()}.${last.toLowerCase()}.${Date.now()}_${i}@example.com`;
    const name = `${first} ${last}`;
    const passwordHash = await hashPassword(plaintextPassword);

    const result = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${passwordHash})
      ON CONFLICT (email) DO NOTHING
      RETURNING id;
    `;

    if (Array.isArray(result) && result.length > 0) {
      inserted += 1;
      if (createdEmails.length < 5) createdEmails.push(email);
    }
  }

  const countRows = await sql`SELECT COUNT(*)::int AS count FROM users;`;
  const total = Array.isArray(countRows) ? (countRows[0] as { count?: number })?.count : null;

  return NextResponse.json({
    ok: true,
    inserted,
    total,
    table: "users",
    sample: {
      emails: createdEmails,
      password: plaintextPassword,
    },
  });
}
