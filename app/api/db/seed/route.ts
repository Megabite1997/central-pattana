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

  console.log('plaintextPassword ------> ', plaintextPassword)

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

  await sql`
    CREATE TABLE IF NOT EXISTS properties (
      id BIGSERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      location TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'retail',
      image_url TEXT,
      price_thb INT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS type TEXT;`;
  await sql`UPDATE properties SET type = 'retail' WHERE type IS NULL;`;
  await sql`ALTER TABLE properties ALTER COLUMN type SET DEFAULT 'retail';`;
  await sql`ALTER TABLE properties ALTER COLUMN type SET NOT NULL;`;

  await sql`ALTER TABLE properties ADD COLUMN IF NOT EXISTS image_url TEXT;`;

  await sql`
    CREATE TABLE IF NOT EXISTS user_favorites (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, property_id)
    );
  `;

  if (reset) {
    await sql`DELETE FROM user_favorites;`;
    await sql`DELETE FROM properties;`;
    await sql`DELETE FROM users;`;
  }

  const defaultProperties = [
    { slug: "cpn-rama-9", title: "Central Rama 9", location: "Bangkok", type: "retail", image_url: "/cpn-45-logo.svg", price_thb: 3200000 },
    { slug: "cpn-world", title: "CentralWorld", location: "Bangkok", type: "retail", image_url: "/cpn-45-logo.svg", price_thb: 5100000 },
    { slug: "cpn-ladprao", title: "Central Ladprao", location: "Bangkok", type: "retail", image_url: "/cpn-45-logo.svg", price_thb: 2800000 },
    { slug: "cpn-westgate", title: "Central WestGate", location: "Nonthaburi", type: "retail", image_url: "/cpn-45-logo.svg", price_thb: 2600000 },
    { slug: "cpn-festival-chiangmai", title: "Central Festival Chiangmai", location: "Chiang Mai", type: "retail", image_url: "/cpn-45-logo.svg", price_thb: 2400000 },
    { slug: "cpn-phuket", title: "Central Phuket", location: "Phuket", type: "retail", image_url: "/cpn-45-logo.svg", price_thb: 3900000 },

    { slug: "cpn-office-tower", title: "Central Pattana Office Tower", location: "Bangkok", type: "office", image_url: "/cpn-45-logo.svg", price_thb: 7500000 },
    { slug: "cpn-hotel", title: "Central Pattana Hotel", location: "Bangkok", type: "hotel", image_url: "/cpn-45-logo.svg", price_thb: 9200000 },
    { slug: "cpn-residential", title: "Central Pattana Residence", location: "Bangkok", type: "residential", image_url: "/cpn-45-logo.svg", price_thb: 6800000 },
  ];

  for (const p of defaultProperties) {
    await sql`
      INSERT INTO properties (slug, title, location, type, image_url, price_thb)
      VALUES (${p.slug}, ${p.title}, ${p.location}, ${p.type}, ${p.image_url}, ${p.price_thb})
      ON CONFLICT (slug) DO NOTHING;
    `;
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
