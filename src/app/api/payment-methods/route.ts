import { NextResponse } from "next/server";
import { getPaymentCredentials } from "@/lib/payment-settings";

// GET /api/payment-methods — public API returning enabled gateways for buyer checkout
export async function GET() {
  try {
    const creds = await getPaymentCredentials();
    return NextResponse.json({
      razorpayEnabled: creds.razorpayEnabled,
      paypalEnabled: creds.paypalEnabled,
      paypalClientId: creds.paypalEnabled ? creds.paypalClientId : "",
    });
  } catch (error) {
    console.error("GET /api/payment-methods error:", error);
    return NextResponse.json(
      { razorpayEnabled: true, paypalEnabled: true, paypalClientId: "" },
      { status: 200 }
    );
  }
}
