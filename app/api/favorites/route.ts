import { sql } from "@/lib/db";
import { getSessionUserIdFromRequest } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  propertyId: z.number().int().positive(),
  favorite: z.boolean(),
});

export async function POST(request: Request) {
  const userId = getSessionUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const propertyId = parsed.data.propertyId;

  if (parsed.data.favorite) {
    await sql`
      INSERT INTO user_favorites (user_id, property_id)
      VALUES (${userId}, ${propertyId})
      ON CONFLICT (user_id, property_id) DO NOTHING;
    `;
  } else {
    await sql`
      DELETE FROM user_favorites
      WHERE user_id = ${userId} AND property_id = ${propertyId};
    `;
  }

  return NextResponse.json({ ok: true });
}
