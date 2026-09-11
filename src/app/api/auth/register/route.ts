import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setAuthCookies } from "@/lib/auth";
import { transferGuestCartToUser } from "@/lib/cart-session";
import { sendMail } from "@/lib/mail";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-production-min-32-chars"
);

const registerSchema = z
  .object({
    firstname: z.string().min(1, "First name is required"),
    lastname: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email").toLowerCase(),
    countryName: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    dialCode: z.string().min(1, "Dial code is required"),
    mobile: z
      .string()
      .min(6, "Phone number must be at least 6 digits")
      .max(15, "Phone number cannot exceed 15 digits")
      .regex(/^[0-9]+$/, "Phone number must contain numbers only"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
    agree: z
      .boolean()
      .refine((v) => v === true, "You must agree to the terms"),
    refBy: z.string().optional(),
    role: z.enum(["buyer", "seller"]).optional().default("buyer"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { firstname, lastname, email, countryName, state, city, dialCode, mobile, password, refBy, role } = parsed.data;

    // Check if email already exists
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hash password with $2b$ at cost 12 (modern Node bcrypt)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate username from email if not provided (firstname + lastname initial)
    const baseUsername = `${firstname.toLowerCase()}${lastname.charAt(0).toLowerCase()}`;
    let username = baseUsername;
    let suffix = 1;
    while (await db.user.findUnique({ where: { username } })) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    let referrerUserId: string | null = null;
    if (refBy) {
      const referrer = await db.user.findUnique({ where: { username: refBy } });
      if (referrer) referrerUserId = referrer.id;
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("=== REGISTRATION OTP ===", { email, otp });

    // Create a temporary stateless token with the registration data and OTP
    const payload = {
      email,
      firstname,
      lastname,
      username,
      countryName,
      state,
      city,
      dialCode,
      mobile,
      password: hashedPassword,
      role: role === "seller" ? 1 : 0,
      otp,
    };

    const registrationToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(JWT_SECRET);

    // Send OTP via email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">Verify your email address</h2>
          <p>Hello ${firstname},</p>
          <p>Thank you for registering at Ready Game Code. Please use the following 6-digit code to verify your email address:</p>
          <div style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #FF7A00; padding: 15px; text-align: center; background: #f9f9f9; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="margin-top: 25px; font-size: 13px; color: #777;">This code is valid for a limited time. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `;

      await sendMail({
        to: email,
        subject: "Your OTP for Ready Game Code",
        html: emailHtml,
      });
    }

    return NextResponse.json(
      {
        success: true,
        requiresOTP: true,
        message: "OTP sent to your email",
        registrationToken,
        user: {
          email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
