import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't leak whether the email exists, just return success
      return NextResponse.json({ success: true, message: "If an account exists, a reset link was generated." });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Save token to DB with 1 hour expiry
    await db.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
      },
    });

    // Simulate sending email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/password-reset/${token}`;
    console.log("=========================================");
    console.log(`PASSWORD RESET URL FOR ${email}:`);
    console.log(resetUrl);
    console.log("=========================================");

    return NextResponse.json({ success: true, message: "If an account exists, a reset link was generated." });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
