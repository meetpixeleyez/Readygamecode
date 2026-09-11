import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return 200 even if user doesn't exist for security reasons (don't leak user existence)
      return NextResponse.json({ message: "If your email is registered, you will receive a reset link." }, { status: 200 });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour expiry

    // Save token to database
    await db.user.update({
      where: { email },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    // Create reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    // Print to console for development testing
    console.log("-----------------------------------------");
    console.log("PASSWORD RESET LINK FOR:", email);
    console.log(resetLink);
    console.log("-----------------------------------------");

    // Send email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${user.firstname || "User"},</p>
          <p>We received a request to reset your password. Click the button below to choose a new one:</p>
          <a href="${resetLink}" style="display: inline-block; background: #FF7A00; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold;">Reset Password</a>
          <p style="margin-top: 25px; font-size: 13px; color: #777;">If you didn't request this, you can safely ignore this email. The link will expire in 1 hour.</p>
        </div>
      `;

      await sendMail({
        to: email,
        subject: "Reset Your Password - Ready Game Code",
        html: emailHtml,
      });
    }

    return NextResponse.json({ message: "If your email is registered, you will receive a reset link." }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
