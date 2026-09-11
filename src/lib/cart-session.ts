import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getCurrentUser } from "./auth";

const GUEST_SESSION_COOKIE = "rgc_guest_session";

/**
 * Returns the cart owner context for the current request.
 * - If user is authenticated: returns { userId, sessionId: null }
 * - If guest: returns { userId: null, sessionId } — sessionId is set as a cookie
 *   (10-year expiry so it persists across sessions)
 */
export async function getCartContext(options: { setCookieIfMissing?: boolean } = {}): Promise<{
  userId: string | null;
  sessionId: string | null;
}> {
  const user = await getCurrentUser();
  if (user) {
    return { userId: user.sub, sessionId: null };
  }

  // Guest — get or create session ID via cookie
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(GUEST_SESSION_COOKIE)?.value;

  if (!sessionId && options.setCookieIfMissing) {
    sessionId = randomUUID();
    cookieStore.set(GUEST_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    });
  }

  return { userId: null, sessionId: sessionId || null };
}

/**
 * Transfers all guest cart items to a newly-authenticated user.
 * Called on successful login/register. Merges duplicates (keeps user's existing addon flags).
 */
export async function transferGuestCartToUser(userId: string, sessionId: string) {
  const { db } = await import("./db");

  const guestItems = await db.cart.findMany({
    where: { sessionId },
  });

  for (const item of guestItems) {
    const existing = await db.cart.findFirst({
      where: { userId, productId: item.productId },
    });

    if (existing) {
      // Merge: keep existing item but update addon flags from guest cart
      await db.cart.update({
        where: { id: existing.id },
        data: {
          reskinSelected: item.reskinSelected || existing.reskinSelected,
          publishSelected: item.publishSelected || existing.publishSelected,
          storeOptimizationSelected:
            item.storeOptimizationSelected || existing.storeOptimizationSelected,
          isExtended: item.isExtended || existing.isExtended,
          extendedAmount: Math.max(item.extendedAmount, existing.extendedAmount),
        },
      });
      await db.cart.delete({ where: { id: item.id } });
    } else {
      // Move to user
      await db.cart.update({
        where: { id: item.id },
        data: { userId, sessionId: null },
      });
    }
  }
}
