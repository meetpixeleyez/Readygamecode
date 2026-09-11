import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookies } from "@/lib/auth";
import { transferGuestCartToUser } from "@/lib/cart-session";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // Allow login with either email or username (matches Laravel findUsername behavior)
    const user = await db.user.findFirst({
      where: {
        OR: [{ email: username.toLowerCase() }, { username }],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (user.role === "ADMIN") {
      return NextResponse.json(
        { error: "Admin login is not allowed here. Please use the Admin portal." },
        { status: 403 }
      );
    }

    if (user.status !== 1) {
      return NextResponse.json(
        { error: "Your account has been banned. Contact support." },
        { status: 403 }
      );
    }

    // Verify password — supports both $2y$ (Laravel) and $2b$ (Node) bcrypt prefixes
    // bcryptjs handles both transparently
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    let updatedData: any = { lastLoginAt: new Date() };
    await db.user.update({
      where: { id: user.id },
      data: updatedData,
    });

    // Transfer guest cart items to this user (if any)
    const guestSession = req.cookies.get("rgc_guest_session")?.value;
    if (guestSession) {
      await transferGuestCartToUser(user.id, guestSession);
    }

    // Issue JWT tokens in httpOnly cookies
    await setAuthCookies({
      sub: user.id,
      email: user.email,
      role: "user",
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
