import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars"
);

export async function POST(req: NextRequest) {
  try {
    const { email, registrationToken } = await req.json();

    if (!email || !registrationToken) {
      return NextResponse.json(
        { error: "Email and registration token are required" },
        { status: 400 }
      );
    }

    let payloadData;
    try {
      // Decode the current registration token (we can ignore expiration for resending, but jwtVerify fails if expired.
      // So let's allow it to fail if it's been more than a day, but for a 15m token, resend is usually within that window.
      // If the user waits 16m and clicks resend, jwtVerify will throw TokenExpiredError. 
      // In that case, we can't regenerate because we lost their payload. They must restart signup.
      const { payload } = await jwtVerify(registrationToken, JWT_SECRET);
      payloadData = payload;
    } catch (err) {
      return NextResponse.json(
        { error: "Session expired. Please start the registration process again." },
        { status: 400 }
      );
    }

    if (payloadData.email !== email) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a NEW temporary stateless token with the registration data and the NEW OTP
    const newPayload = {
      ...payloadData,
      otp, // Update with the new OTP
    };

    // Remove jose specific claims before re-signing
    delete newPayload.exp;
    delete newPayload.iat;
    delete newPayload.nbf;
    delete newPayload.iss;

    const newRegistrationToken = await new SignJWT(newPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    // Send OTP via email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Your New OTP</h2>
          <p>Hello ${newPayload.firstname},</p>
          <p>You requested a new verification code. Please use the following 6-digit code to verify your email address:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FF7A00; padding: 15px; text-align: center; background: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="margin-top: 25px; font-size: 13px; color: #777;">This code is valid for 15 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `;

      await sendMail({
        to: email,
        subject: "Your New OTP for Ready Game Code",
        html: emailHtml,
      });
    }

    console.log("-----------------------------------------");
    console.log("RESEND OTP FOR:", email);
    console.log(otp);
    console.log("-----------------------------------------");

    return NextResponse.json(
      { 
        success: true, 
        message: "A new OTP has been sent to your email",
        registrationToken: newRegistrationToken
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
