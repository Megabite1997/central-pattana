import crypto from "node:crypto";

export type SessionPayload = {
  sub: string;
  email?: string;
  iat?: number;
};

export function createSessionToken(payload: SessionPayload, secret: string) {
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");
  return `${payloadB64}.${signature}`;
}

function timingSafeEqualString(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest("base64url");

  if (!timingSafeEqualString(signature, expectedSignature)) return null;

  try {
    const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf8");
    const parsed = JSON.parse(payloadJson) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const sub = (parsed as { sub?: unknown }).sub;
    const email = (parsed as { email?: unknown }).email;
    const iat = (parsed as { iat?: unknown }).iat;

    if (typeof sub !== "string" || sub.length === 0) return null;

    return {
      sub,
      ...(typeof email === "string" ? { email } : null),
      ...(typeof iat === "number" ? { iat } : null),
    };
  } catch {
    return null;
  }
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export function getSessionUserIdFromRequest(request: Request) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;

  const cookieHeader = request.headers.get("cookie");
  const token = getCookieValue(cookieHeader, "cp_session");
  if (!token) return null;

  const payload = verifySessionToken(token, secret);
  if (!payload) return null;

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId) || userId <= 0) return null;

  return userId;
}
