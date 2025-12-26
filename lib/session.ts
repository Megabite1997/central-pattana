import jwt from "jsonwebtoken";

const SESSION_COOKIE_NAME = "cp_session";

export type SessionPayload = {
  sub: string;
  email?: string;
  iat?: number;
};

export function createSessionToken(payload: SessionPayload, secret: string) {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    noTimestamp: true,
  });
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!decoded || typeof decoded !== "object") return null;

    const sub = (decoded as { sub?: unknown }).sub;
    const email = (decoded as { email?: unknown }).email;
    const iat = (decoded as { iat?: unknown }).iat;

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

type CookieSetter = {
  set: (options: {
    name: string;
    value: string;
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none";
    secure: boolean;
    path: string;
    maxAge?: number;
  }) => void;
};

export function setSessionCookie(
  cookies: CookieSetter,
  args: { userId: string | number; email?: string; remember?: boolean }
) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return;

  const remember = args.remember ?? true;
  const token = createSessionToken(
    { sub: String(args.userId), ...(args.email ? { email: args.email } : null), iat: Date.now() },
    secret
  );

  cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : null),
  });
}

export function clearSessionCookie(cookies: CookieSetter) {
  cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
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
  const token = getCookieValue(cookieHeader, SESSION_COOKIE_NAME);
  if (!token) return null;

  const payload = verifySessionToken(token, secret);
  if (!payload) return null;

  const userId = Number(payload.sub);
  if (!Number.isFinite(userId) || userId <= 0) return null;

  return userId;
}
