import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookies } from "@/lib/auth";
import { transferGuestCartToUser } from "@/lib/cart-session";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars"
);

export async function POST(req: NextRequest) {
  try {
    const { email, otp, registrationToken } = await req.json();

    if (!email || !otp || !registrationToken) {
      return NextResponse.json(
        { error: "Email, OTP, and Registration Token are required" },
        { status: 400 }
      );
    }

    let payloadData;
    try {
      const { payload } = await jwtVerify(registrationToken, JWT_SECRET);
      payloadData = payload;
    } catch (err) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please try registering again." },
        { status: 400 }
      );
    }

    if (payloadData.otp !== otp || payloadData.email !== email) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Now check if the email is still available just in case
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Generate username from email if not provided (fallback check)
    let username = payloadData.username as string;
    let suffix = 1;
    while (await db.user.findUnique({ where: { username } })) {
      username = `${payloadData.username}${suffix}`;
      suffix++;
    }

    // Create the user in the database
    const user = await db.user.create({
      data: {
        email: payloadData.email as string,
        firstname: payloadData.firstname as string,
        lastname: payloadData.lastname as string,
        username,
        countryName: (payloadData.countryName as string) || null,
        state: (payloadData.state as string) || null,
        city: (payloadData.city as string) || null,
        dialCode: (payloadData.dialCode as string) || null,
        mobile: (payloadData.mobile as string) || null,
        password: payloadData.password as string,
        status: 1,
        profileComplete: 1,
        isAuthor: payloadData.role as number,
      },
    });

    // Issue JWT tokens
    await setAuthCookies({
      sub: user.id,
      email: user.email,
      role: "user",
      username: user.username,
    });

    // Transfer guest cart items to this user (if any)
    const guestSession = req.cookies.get("rgc_guest_session")?.value;
    if (guestSession) {
      await transferGuestCartToUser(user.id, guestSession);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
