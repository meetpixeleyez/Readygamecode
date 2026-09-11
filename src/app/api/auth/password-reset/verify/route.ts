import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Valid token and new password (min 6 chars) are required" }, { status: 400 });
    }

    // Verify token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: "Token has expired" }, { status: 400 });
    }

    // Hash new password using bcrypt-2b
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password within a transaction
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { email: resetToken.email },
        data: {
          password: hashedPassword,
        },
      });

      // Delete the used token
      await tx.passwordResetToken.deleteMany({
        where: { email: resetToken.email },
      });
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password reset verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
