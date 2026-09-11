import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPaymentCredentials } from "@/lib/payment-settings";
import { z } from "zod";

// GET /api/admin/payment-settings — Returns admin payment configuration
export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const creds = await getPaymentCredentials();

    return NextResponse.json({ settings: creds });
  } catch (error) {
    console.error("GET /api/admin/payment-settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

const updateSettingsSchema = z.object({
  razorpayEnabled: z.boolean().default(true),
  razorpayKeyId: z.string().optional(),
  razorpayKeySecret: z.string().optional(),
  paypalEnabled: z.boolean().default(true),
  paypalClientId: z.string().optional(),
  paypalClientSecret: z.string().optional(),
  paypalMode: z.enum(["sandbox", "live"]).default("sandbox"),
});

// POST /api/admin/payment-settings — Save admin payment configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || (session.role !== "admin" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updated = await db.paymentSetting.upsert({
      where: { id: "default" },
      update: {
        razorpayEnabled: parsed.data.razorpayEnabled,
        razorpayKeyId: parsed.data.razorpayKeyId || "",
        razorpayKeySecret: parsed.data.razorpayKeySecret || "",
        paypalEnabled: parsed.data.paypalEnabled,
        paypalClientId: parsed.data.paypalClientId || "",
        paypalClientSecret: parsed.data.paypalClientSecret || "",
        paypalMode: parsed.data.paypalMode,
      },
      create: {
        id: "default",
        razorpayEnabled: parsed.data.razorpayEnabled,
        razorpayKeyId: parsed.data.razorpayKeyId || "",
        razorpayKeySecret: parsed.data.razorpayKeySecret || "",
        paypalEnabled: parsed.data.paypalEnabled,
        paypalClientId: parsed.data.paypalClientId || "",
        paypalClientSecret: parsed.data.paypalClientSecret || "",
        paypalMode: parsed.data.paypalMode,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error("POST /api/admin/payment-settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
