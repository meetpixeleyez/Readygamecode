import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookies } from "@/lib/auth";
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

    // Allow login with either email or username
    const admin = await db.user.findFirst({
      where: {
        OR: [{ email: username.toLowerCase() }, { username }],
        role: "ADMIN",
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password — supports both $2y$ (Laravel) and $2b$ (Node) bcrypt prefixes
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    await db.user.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    // Issue JWT tokens in httpOnly cookies
    await setAuthCookies({
      sub: admin.id,
      email: admin.email,
      role: "admin",
      username: admin.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        name: (admin.firstname || "") + " " + (admin.lastname || ""),
        role: "ADMIN",
      },
    });
  } catch (error) {
    console.error("Admin Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
