import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars"
);

const ACCESS_TOKEN_TTL = "7d"; // 7 days
const REFRESH_TOKEN_TTL = "30d"; // 30 days
const ACCESS_COOKIE = "rgc_access";
const REFRESH_COOKIE = "rgc_refresh";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: "BUYER" | "SELLER" | "ADMIN" | "user" | "admin" | "reviewer";
  username?: string | null;
}

// -----------------------------------------------------------------------------
// Token creation
// -----------------------------------------------------------------------------

export async function createAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuer("readygamecode")
    .setAudience("readygamecode-user")
    .sign(JWT_SECRET);
}

export async function createRefreshToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .setIssuer("readygamecode")
    .setAudience("readygamecode-refresh")
    .sign(JWT_SECRET);
}

// -----------------------------------------------------------------------------
// Token verification
// -----------------------------------------------------------------------------

export async function verifyAccessToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "readygamecode",
      audience: "readygamecode-user",
    });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "readygamecode",
      audience: "readygamecode-refresh",
    });
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

// -----------------------------------------------------------------------------
// Cookie helpers — run in server components / route handlers
// -----------------------------------------------------------------------------

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export async function setAuthCookies(payload: JwtPayload) {
  const cookieStore = await cookies();
  const accessToken = await createAccessToken(payload);
  const refreshToken = await createRefreshToken(payload);

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  let payload: JwtPayload | null = null;
  
  if (accessToken) {
    payload = await verifyAccessToken(accessToken);
  }

  // If access token is missing or expired, attempt refresh token fallback
  if (!payload) {
    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    if (refreshToken) {
      const refreshPayload = await verifyRefreshToken(refreshToken);
      if (refreshPayload) {
        payload = {
          sub: refreshPayload.sub,
          email: refreshPayload.email,
          role: refreshPayload.role,
          username: refreshPayload.username,
        };
        try {
          await setAuthCookies(payload);
        } catch {
          // ignore if setAuthCookies fails in Server Component context
        }
      }
    }
  }

  if (!payload) return null;

  try {
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { status: true },
    });
    
    // status 1 = Active. Any other status (like 0 for Banned) should invalidate the session
    if (!user || user.status !== 1) {
      return null;
    }
  } catch (error) {
    // Fallback if DB check fails
  }

  return payload;
}

// -----------------------------------------------------------------------------
// Constant-time string comparison (for HMAC verification)
// -----------------------------------------------------------------------------

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
