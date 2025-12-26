import { sql } from "@/lib/db";
import { getSessionUserIdFromRequest } from "@/lib/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const rows = await sql`
    SELECT
      p.id,
      p.slug,
      p.title,
      p.location,
      p.type,
      p.image_url,
      p.price_thb,
      EXISTS(
        SELECT 1
        FROM user_favorites uf
        WHERE uf.user_id = ${userId} AND uf.property_id = p.id
      ) AS is_favorite
    FROM properties p
    ORDER BY p.id ASC;
  `;

  const properties = Array.isArray(rows)
    ? rows.map((r) => {
        const row = r as {
          id: string | number;
          slug: string;
          title: string;
          location: string;
          type: string | null;
          image_url: string | null;
          price_thb: number | null;
          is_favorite: boolean;
        };

        return {
          id: Number(row.id),
          slug: row.slug,
          title: row.title,
          location: row.location,
          type: row.type ?? "retail",
          imageUrl: row.image_url ?? "/cpn-45-logo.svg",
          priceThb: row.price_thb,
          isFavorite: Boolean(row.is_favorite),
        };
      })
    : [];

  return NextResponse.json({ ok: true, properties });
}
